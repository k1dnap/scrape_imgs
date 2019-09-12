const puppeteer = require('puppeteer')
const fs = require('fs').promises;
settings = require('../settings.json')

width= 1600;
height= 1000;

//funcs
let waitFor = async(element)=>{
	let result;
	await page.waitFor(element, {timeout:30000})
	let cycle = 0;
	while(!result){
		cycle++;
		if (cycle >= 90) throw 'repeat';
		//check if page is not disconnected
		result = 	await page.evaluate( (element)=>{
			try {
				return document.querySelector(element).getAttribute('style').includes('display: none')
			} catch (error) {
				return false;
			}
		}, element)
		await new Promise(resolve => setTimeout(resolve, 200));// sleep 5 sec
	};
};

scrape = async  (params={})=>{
	let url = params.product.url;
	//the return value
	let err;
	let temp;
	if (params.temp) {
		temp = params.temp;
	}	else {
		temp = {}
		temp.finished_simples = [];
		temp.finished_products = [];
		temp.errors = []
	}
	//start browser
  const browser = await puppeteer.launch({
		headless:false,
		// headless:true,
		args: [
			'--no-sandbox'
			// `--window-size=1600,1000`
			// `--window-size=${options.width},${options.height}`
		]
	});
  try {
		page = await browser.newPage();
		//viewport
		let category = params.product.category_of;
		if (category == 'Stools'){
			let fakeDevice = puppeteer.devices['iPhone 6'];
			await page.emulate(fakeDevice);
		} else {
			await page.setViewport({
				width: 12*settings.canvas_settings.width,
				height: 9*settings.canvas_settings.height,
			})
		}
		//go to page
		console.log('started: '+url)
		await page.goto(url,
			{"waitUntil":["domcontentloaded"], 'timeout': 60000}
		);
		//scroll to canvas
		await page.evaluate( ()=>{
			document.querySelector('#configurator_container').scrollIntoView()
		})
		//catch if the main frame loaded
		await waitFor('#loading-screen')
		//wait for the frame loaded fully
		await waitFor('#loading-screen-small')
		//reset page size
		if(category == 'Stools'){
			await page.setViewport({
				width: 12*settings.canvas_settings.width,
				height: 9*settings.canvas_settings.height,
			})
					//catch if the main frame loaded
			await waitFor('#loading-screen')
			//wait for the frame loaded fully
			await waitFor('#loading-screen-small')
		}
		//hide elements
		await page.evaluate( ()=>{
			//
			document.querySelector('#loading-screen-interaction').hidden = true;
			document.querySelector('div.copyright').hidden = true;
			document.querySelector('#interface-info').hidden = true;
			//navbar
			document.querySelector("body > div.page-wrapper > div.top-bar").hidden = true
			//bottom padding
			document.querySelector('div.product.info.detailed').hidden = true;

			//suggestion products?
			try {
				document.querySelector('div.block.related').hidden = true;
			} catch (error) {
				
			}
			//footer
			try {
				document.querySelector('#main-footer').hidden = true;
			} catch (error) {
				
			}
			//cookies 
			try {
			document.querySelector('div[aria-label="cookieconsent"]').hidden = true;
			} catch (error) {
				
			}
		});
		//extract simples
		let simples = await page.evaluate( (category)=>{
			simples_test = Array.from(document.querySelector("#maincontent > div.columns > div > script:nth-child(8)").outerText.split('"simples": [')[1].split(']')[0].split(','))
			//extract elements as string
			.map(simple=> {
				return simple.split('"')[1].split('"')[0]
			})
			// category = 'Stools'
			//get all the top elements
			top_elements = Array.from(document.querySelector('#interface-buttons-left').querySelectorAll('li.uk-open'))
			//filter by active
			.filter(el=>el.parentElement.closest('li').getAttribute('class').includes('active'))
			//ignore 'Open'
			.filter(el=>el.textContent.trim()!=='Open')
			//get 2d array, like arr = [[1,2,3],[4,5,6]]
			.map(el=>{
				arr = Array.from(el.querySelectorAll('a'))
				//filter visible one
				.filter(a=> {
					try {
						return (!a.getAttribute('style').includes('display: none'))
					} catch (e) {
						return false;
					}
				})
				// {name : 'name', element: element}
				.map(el=>{
					let obj = {};
					obj.element = el;
					obj.name = el.textContent.trim().toUpperCase();
					return obj;
				});
				return arr;
			})
			//lower elements
			low_elements = Array.from(document.querySelector('#controls').querySelectorAll('li.uk-open'))
			//get 2d of arrays, like arr = [[1,2,3],[4,5,6]]
			.map(el=>{
				arr = Array.from(el.querySelectorAll('a.control-variation'))
				.map(el=>{
					obj = {}
					obj.name = el.getAttribute('data-code').toUpperCase();
					obj.element = el;
					return obj;
				})
				return arr;
			})
			//merge them and reverse;
			all_elements = top_elements.concat(low_elements).reverse();
			simples = Array.from(document.querySelector("#maincontent > div.columns > div > script:nth-child(8)").outerText.split('"simples": [')[1].split(']')[0].split(','))
			//extract elements as string
			.map(simple=> {
				obj = {};
				obj.orig_name = simple.split('"')[1].split('"')[0];
				obj.name = obj.orig_name.replace('\\/', '-').split(' ').join('-');
				let elems = obj.orig_name.split('_');
				obj.indexes = [];
				let iter = 0;
				for (let index in low_elements){
					let name = elems[elems.length-1-iter]
					let search = all_elements[iter].filter(element=>element.name == name)[0];
					if (!search) return null
					let el = [iter,all_elements[iter].indexOf(search)];
					obj.indexes.push({name, el})
					iter++
				};
				if (category == 'Stools'){
					let min = Math.min(...simples_test.map(el=>el.split('\\/')[1].split('-').join('_').split('_')[0]))
					let max = Math.max(...simples_test.map(el=>el.split('\\/')[1].split('-').join('_').split('_')[0]))
					for (let index of top_elements){
						let name = obj.name.split('_')[0].split('-')[1];
						let obj_index = 0;
						if (name > min) {
							if (name == max)obj_index = all_elements[iter].length-1;
							else obj_index = obj_index = all_elements[iter].length-2;
						} else {
							obj_index = 0;
						}
						let el = [iter, obj_index]
						obj.indexes.push({name, el})
						iter++;
					}
				} else {	//tables beds, etc
					for (let index of top_elements){
						let number_or_size = ['R','XR','Q','K','S','M'].some( letter=>{
							return all_elements[iter].map(el=>el.name).includes(letter)
						})
						let name;
						if(number_or_size){
							name = elems[elems.length-1-iter].split(' ')[0].split('-')[1];
							//beds part
							// if (name.includes('P')){
							// 	name = name.split('P').filter(el=>el!== '')[0]
							// }							
							if (category == 'Beds'){
								if (name.includes('K')) name = 'K'
								else if (name.includes('Q')) name = 'Q'
							}
						} else {
							let el_length = elems[elems.length-1-iter].split(' ').length;
							name = elems[elems.length-1-iter].split(' ')[el_length-1]
						}
						let search = all_elements[iter].filter(element=>element.name == name)[0];
						let el = [iter,all_elements[iter].indexOf(search)];
						if(all_elements[iter].indexOf(search) < 0){
							name = elems[elems.length-1-iter].split(' ')[0].split('-')[1]
							search = all_elements[iter].filter(element=>element.name == name)[0]
							el =[iter,(name == 'R') ? 0 : 1]
						}
						obj.indexes.push({name, el})
						iter++;
					}
				}

				obj.indexes = obj.indexes.reverse();
				return obj;
			})
			//delete null objects
			.filter(el=>el!== null);

			return simples;
		}, category)
		//filter simples, check if any was already finished
		simples = simples.filter((simple)=>{
			if(temp.finished_simples.includes(simple.name) ){
				return false;
			}
			return true;
		})
		// simples = simples.filter((simple, i)=> i >= 105)
		// simples = simples.filter(simple=>{
		// 	return simple.name.includes('1496')
		// }) //test 
		//test indexes, if any of them is bigger than -1
		let check_indexes_arr = simples.map( simple=>{
			return simple.indexes.map(index=>{
				return index.el[1]
			})
		});
		check_indexes_arr = [].concat.apply([], check_indexes_arr)
		//if some of them is broken
		if(check_indexes_arr.some(el=>el<0)){
			throw 'indexes are broken for '+url;
		}
		//#test part 
		let test = params.test;
		if(test)throw 'test success';//test
		//#
		let canvas = await page.$('canvas');
		//change resolution
		let canvas_settings = settings.canvas_settings
		await page.evaluate( (canvas_settings)=>{
			console.log(canvas_settings)
			document.querySelector('#configurator_container').style = `width: ${canvas_settings.width*11}px; height: ${canvas_settings.height*8}px;`	
			height = document.querySelector('canvas').height
			height = Math.round(height*canvas_settings.height/100)
			width = document.querySelector('canvas').width
			width = Math.round(width*canvas_settings.width/100)
			document.querySelector('canvas').height = height;
			document.querySelector('canvas').width = width;
			document.querySelector('canvas').style = "width: "+width+"px; height: "+height+"px;"
			document.querySelector('#controls-container').hidden = true;
		}, (canvas_settings))
		// depr?
		let current_pos = {}; 
		[...Array(simples[0].indexes).keys()].map( el=> current_pos[el] = 0);
		//click
		let click = async (arr=[])=>{
			await page.evaluate( (arr)=>{
				let arr_index = arr[0];
				let obj_index = arr[1];
				all_elements[arr_index][obj_index].element.click();
			}, (arr))
			current_pos[arr[0]] = arr[1];
			await waitFor('#loading-screen-small')
			return;
		}
		// let screen_num = 0;//test
		let screenshot = async (index)=>{
			// screen_num++;//test
			await waitFor('#loading-screen-small')
			let name = simples[index].name;
			let path = './screenshots/'+category+'/'+name+'.jpg';
			//hide dark elements 
			await page.evaluate( ()=>{
				try {
					document.querySelector('div.mfp-bg').hidden = true;
				} catch (error) {
					
				}
				try {
					document.querySelector('div.mfp-auto-cursor').hidden = true;
				} catch (error) {
					
				}
			})
			console.log(index+'/'+simples.length+' taking screenshot for :'+name)
			await fs.mkdir('./screenshots/'+category, { recursive: true });
			await canvas.screenshot({path, type:'jpeg', quality: 95});
			await new Promise(resolve => setTimeout(resolve, 1000));// sleep 5 sec
			temp.finished_simples.push(simples[index].orig_name)
			let template1 = JSON.stringify(temp, null, 2)
			if (params.write_temp) await fs.writeFile('./data/temp.json', template1);
			return;
		}
		let performClicks = async (index)=>{
			for(let el of simples[index].indexes){
				await click(el.el)
			}
			return;
		}
		//click -> screenshot
		for (let simple in simples){
			if (temp.finished_simples.includes(simples[simple].orig_name)){
				console.log('already done, skipping '+ simples[simple].orig_name)
				continue;
			}
			//click buttons of indexes
			await performClicks(simple);
			//make a screenshot
			await screenshot(simple);
		}
		console.log('finished: '+url)
	} catch (error) {
		err = error;
		console.log(error)
		if (error === 'skipping bcs already done this simples: '+url){
			console.log(error);
			err = null;
		}
	}
	await browser.close();
	return err;
}
module.exports = scrape;
// main();