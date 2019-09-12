const puppeteer = require('puppeteer')
const fs = require('fs').promises;

list_of_categories = require('../settings.json').list_of_categories

scrapeProducts = async  (params={})=>{
  const browser = await puppeteer.launch();
  // const browser = await puppeteer.launch({headless:false});
	const page = await browser.newPage();
	await page.setRequestInterception(true);
	// disable css imgs fonts
	page.on('request', (request) => {
		if (['image', 'stylesheet', 'font'].indexOf(request.resourceType()) !== -1) {
				request.abort();
		} else {
				request.continue();
		}
	});
	
	await page.goto(`https://www.calligaris.com/ea_us/`,
		{"waitUntil":["domcontentloaded"], 'timeout': 60000}
	);
	let categories = await page.evaluate( ()=>{
		return Array.from(document.querySelector("#main-navigation > ul > li:nth-child(2) > div > div > ul.list-unstyled.g-list-columns--2").querySelectorAll('a'))
		.map( el=>{
			let obj = {}
			obj.name = el.textContent.trim();
			obj.href = el.href; 
			return obj;
		})
	}) 
	console.log('got '+categories.length+' categories')
	categories = categories.filter( category =>list_of_categories.includes(category.name) );
	let data = []
	let getItems = async (category)=>{
		await page.goto(category.href,
			{"waitUntil":["domcontentloaded"], 'timeout': 60000}
		);
		let products = await page.evaluate(()=>{
			data = Array.from(document.querySelectorAll('p.product.name.product-item-name'))
			.map(el=>{
				return el.querySelector('a').href
			})
			return data;
		})
		return products;
	};
	for (let category of categories){
		let result = await getItems(category);
		console.log('got '+result.length+' products for '+ category.name)
		category.products = result;
	};
	let test;
	if (params.test) test = true;
	if(!test){
		let template1 = JSON.stringify(categories, null, 2)
		await fs.writeFile('./data/products.json', template1);
		console.log('products.json saved')
	}
	await browser.close();
	return categories;
}
module.exports = scrapeProducts;
// main();