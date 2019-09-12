let scrape = require('./utils/scraper')

main = async ()=>{
	let products = [
		{
			"url": "https://www.calligaris.com/ea_us/shop/college-cs-3394-w-lh.html",
			"category_of": "Chairs"
		},
		{
			"url": "https://www.calligaris.com/ea_us/shop/college-cs-3394-m-lh.html",
			"category_of": "Chairs"
		},
		{
			"url": "https://www.calligaris.com/ea_us/shop/gala-cs-1866-lh.html",
			"category_of": "Chairs"
		},
		{
			"url": "https://www.calligaris.com/ea_us/shop/mediterranee-cs-1863-v.html",
			"category_of": "Chairs"
		},
		{
			"url": "https://www.calligaris.com/ea_us/shop/bess-cs-1445-lh.html",
			"category_of": "Stools"
		},
		// {
		// 	url: "https://www.calligaris.com/ea_us/shop/jungle-cs-4104-rc-200.html",
		// 	category_of: 'Tables'
		// },

		// {
		// 	url: "https://www.calligaris.com/ea_us/shop/basil-w-cs-1495.html",
		// 	category_of: 'Stools'
		// },

		// {
		// 	url: "https://www.calligaris.com/ea_us/shop/erie-cs-6059-k.html",
		// 	category_of: 'Beds'
		// },
	]
	temp = {}
	temp.finished_simples = [];
	temp.finished_products = [];
	temp.errors = []
	let total = products.length;
	for(let product of products){
		//ignore finished
		total--;
		console.log('left to finish main script: '+total+' of '+products.length)
		let err = 'repeat'//default
		while(err){
			err = await scrape({product, temp});
			if (err === 'repeat'){
				console.log('repeating '+product.url)
				continue;
			}
			if (err) console.log(err)
			err = null;
		}
	}
	console.log('parse_list done')
}
main()