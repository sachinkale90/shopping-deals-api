const PORT = process.env.PORT || 8000
const express = require('express')
const axios = require('axios')
const cheerio = require('cheerio')
const fs = require('fs');

const app = express()
const dealSites = [
    {
        name: 'DealsOfAmerica',
        address: 'https://www.dealsofamerica.com/',
        base: ''
    }
]

const deals = []
dealSites.forEach(dealSite =>{
    axios.get(dealSite.address)
        .then((response) =>{
            const html = response.data;
            const $ = cheerio.load(html)

            $('.deal', html).each(function (i, item ) {
                var $a = $(item).find('.title a');
                const title = $a.text();
                const url = $a.attr('href');
                const postedTime = $(item).find('.store_time_div time').text();
                const originalPrice  = $(item).find('.deal_price_info .price_tags .orig-price').text();
                const dealPrice = $(item).find('.deal_price_info .price_tags .doa-price').text();
                const dealType = originalPrice != '' ? 'Item' : 'Membership';
                if(title != undefined && title){
                    //console.log(title, url, postedTime.replace('Posted at ',''), originalPrice, dealPrice);
                 deals.push({
                    title: title,
                    url: url,
                    postedTime: postedTime.replace('Posted at ',''),
                    dealType: dealType,
                    originalPrice: originalPrice,
                    dealPrice: dealPrice,
                    priceChange: dealType == 'Item' ? parseFloat((((parseFloat(dealPrice.replace('$','')) - parseFloat(originalPrice.replace('$','')))/parseFloat(originalPrice.replace('$',''))) * 100).toFixed(2))+"%":'',
                    source: dealSite.name
                })}
            })

        }).catch((error) => console.log(error))
})

function compareValues(key, order = 'asc') {
    return function innerSort(a, b) {
      if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
        // property doesn't exist on either object
        return 0;
      }
  
      var varA = (typeof a[key] === 'string')
        ? a[key].toUpperCase() : a[key];
      var varB = (typeof b[key] === 'string')
        ? b[key].toUpperCase() : b[key];
  
      if(key == 'priceChange'){
          if(varA != '' && varB != ''){
            varA = parseFloat(varA.replace('%',''));
            varB = parseFloat(varB.replace('%',''))
            
          }
      }

      let comparison = 0;
      if (varA >= varB) {
        comparison = 1;
      } else if (varA <= varB) {
        comparison = -1;
      }
      return (
        (order === 'desc') ? (comparison * -1) : comparison
      );
    };
  }
  

app.get('/', (req, res) => {
    res.writeHead(200, { 'Content-Type':'text/html'});
    html = fs.readFileSync('./index.html');
    res.end(html)
})

app.get('/deals', (req, res) => {
    res.json(deals)
})

app.get('/deals/AscendingPrice', (req, res) => {
    res.json(deals.sort(compareValues('dealPrice')));
})

app.get('/deals/DescendingPrice', (req, res) => {
    res.json(deals.sort(compareValues('dealPrice', 'desc')));
})

app.get('/deals/AscendingPostedTime', (req, res) => {
    res.json(deals.sort(compareValues('postedTime')));
})

app.get('/deals/DescendingPostedTime', (req, res) => {
    res.json(deals.sort(compareValues('postedTime', 'desc')));
})

app.get('/deals/Recommended', (req, res) => {
    res.json(deals.filter(x=> x.dealType != 'Membership').sort(compareValues('priceChange')));
})


app.get('/deals/:ItemName', async (req, res) => {
    var itemName = req.params.ItemName;
    res.json(deals.filter(x => x.title.toLowerCase().includes(itemName.toLowerCase())));
})

app.listen(PORT, () => console.log(`server running on PORT ${PORT}`))