let scrape = require('./utils/scraper')
let scrapeProducts = require('./utils/scrapeProducts')
const fs = require('fs').promises;


//load categories + products
loadData = async ()=>{
	try {
		data = require('./data/products.json')
	} catch (e) {
		console.log(e);
		console.log('no data presented, refreshing categories + products')
		data = await scrapeProducts();
	}
	return;
}
//load temp
( () => {
	try {
		temp = require('./data/temp.json')
		
	} catch (error) {
		temp = {}
		temp.finished_simples = [];
		temp.finished_products = [];
		temp.errors = []
	
	}
})()

main = async ()=>{
	await loadData();
	let products = []
	data.map(category=> category.products.map(product=>{
		products.push({url:product, category_of: category.name})
	}))
	let total = products.length;
	for(let product of products){
		//ignore finished
		total--;
		if(temp.finished_products.includes(product.url)) continue;
		console.log('left to finish main script: '+total+' of '+products.length)
		//push to temp
		let err = 'repeat'//default
		while(err){
			err = await scrape({product, temp, write_temp:true });
			// err = await scrape({product});
			if (err === 'repeat'){
				console.log('repeating '+product.url)
				continue;
			}
			if(err) temp.errors.push([product,err])
			else temp.finished_products.push(product.url);
			err = null;
		}
		//update temp.file
		let template1 = JSON.stringify(temp, null, 2);
		await fs.writeFile('./data/temp.json', template1);
	}
	console.log('main() done')
}
main()