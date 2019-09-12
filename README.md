#scrape imgs

- unpack archive
- be sure to have nodejs installed
- type `npm i` in terminal to install all the dependencies( puppeteer in this case)
- type `node index` in terminal to start the script

after you launch the script, and finish at least one product, you'll have 2 additional files at `./data`, `products.json` and `temp.json`
- `temp.json` contains all the data about the process workflow, if you want to recollect the images, delete `temp.json`, and the script automatically will start the process from the beginning.
- `products.json` contains the data about the products from website, if you want to rescrape the list of products, simply delete `products.json`. And the script automatically will rescrape all the products. 
- In order to select different categories for list of products, open `./settings.json`, find a variable named `list_of_categories` and add\delete categories.
- In order to manage images size, open `./settings.json`, find a variable named `canvas_settings`, there are `width` and `heigth`, they take integer, and will adjust images in %, `100` - means original size, 100%, `140` - means 100+40% size.

- there is also `test.js` in folder, simply run it and it will check the script workflow for all over the products, without checking the `click->screenshot` process. 

