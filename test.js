let scrape = require('./utils/scraper')
let scrapeProducts = require('./utils/scrapeProducts')
const fs = require('fs').promises;

test = true;
//1 product test
(async ()=>{
	//temp
	temp = {}
	// temp.data = data;
	temp.finished_simples = [];
	temp.finished_products = [];
	temp.errors = []
	let product = {
		"url": "https://www.calligaris.com/ea_us/shop/erie-cs-6059-bk.html",
		"category_of": "Beds"
	}
	let err = 'repeat'//default
	while(err){
		err = await scrape({product, temp, test});
		if (err === 'repeat'){
			console.log('repeating '+product.url)
			continue;
		}
		if(err !== 'test success') temp.errors.push([product,err])
		else temp.finished_products.push(product.url);
		err = null;
	}
})

test = async ()=>{
	//#scrapeProducts
	data = await scrapeProducts({test:true});
	if (data.length ===0) throw 'scrapeProducts returned empty array'
	else console.log('scrapeProducts - pass')
	//#
	//#scrape
	//temp
	temp = {}
	temp.data = data;
	temp.finished_simples = [];
	temp.finished_products = [];
	temp.errors = []
	//scrape()
	let products = []
	data.map(category=> category.products.map(product=>{
		products.push({url:product, category_of: category.name})
	}))
	let total = products.length;
	for(let product of products){
		//ignore finished
		total--;
		if(temp.finished_products.includes(product.url)) continue;
		console.log('left till finish test: '+total+' of '+products.length)
		//push to temp
		let err = 'repeat'//default
		while(err){
			err = await scrape({product, temp, test});
			if (err === 'repeat'){
				console.log('repeating '+product.url)
				continue;
			}
			if(err !== 'test success') temp.errors.push([product,err])
			else temp.finished_products.push(product.url);
			err = null;
		}
		//update temp.file
		let template1 = JSON.stringify(temp, null, 2)
		await fs.writeFile('./data/test_results.json', template1);
	}
	console.log('test() done with '+
	'\ntotal: '+ products.length+
	'\nsuccess: '+temp.finished_products.length +
	'\nerrors: ' +temp.errors.length+
	'\ncheck for the logs ./utils/test_results.json')
	//#
}
// test();
