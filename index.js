//Credits to @thmsgbrt --> https://github.com/thmsgbrt
require('dotenv').config();
const Mustache = require('mustache');
const fetch = require('node-fetch');
const fs = require('fs');
var unirest = require("unirest");
const puppeteerService = require('./puppeteer-service');
const MUSTACHE_MAIN_DIR = './mustache-main';
//This might be modified
var query = "Bogota,CO,"
var igAccount = 'cool_wallpapersbg'
var localeString = 'es-CO'
var timeZone = "America/Bogota"
//
let DATA = {
    refresh_date: new Date().toLocaleDateString(localeString, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        timeZoneName: 'short'
    }),
};

async function setWeatherInformation() {
    await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${query}&appid=${process.env.OPEN_WEATHER_MAP_KEY}&units=metric`
    ).then(r => r.json())
        .then(r => {
            DATA.city_temperature = Math.round(r.main.temp);
            DATA.city_weather = r.weather[0].description;
            DATA.city_weather_icon = r.weather[0].icon;
            DATA.sun_rise = new Date(r.sys.sunrise * 1000).toLocaleString(localeString, {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: timeZone,
            });
            DATA.sun_set = new Date(r.sys.sunset * 1000).toLocaleString(localeString, {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: timeZone,
            });
        });
};

async function setInstagramPosts() {
    const instagramImages = await puppeteerService.getLatestInstagramPostsFromAccount(
        igAccount, 3
    );
    DATA.igAccount = igAccount;
    DATA.img1 = instagramImages[0];
    DATA.img2 = instagramImages[1];
    DATA.img3 = instagramImages[2];
}

async function getCocktail() {
    await fetch(
        `https://www.thecocktaildb.com/api/json/v1/1/random.php`
    ).then(r => r.json())
        .then(r => {
            DATA.drink = {
                full_drink: r.drinks[0],
                drink_name: r.drinks[0].strDrink,
                alcoholic_name: r.drinks[0].strAlcoholic,
                category: r.drinks[0].strCategory,
                instructions: r.drinks[0].strInstructions,
                image: r.drinks[0].strDrinkThumb,
                //Missing array for ingredients
                ingredients: Array(),
                quantities: Array()
            };
            let tot = Object.keys(r);
            tot.forEach((key) => {
                if (key.includes("strIngredient"))
                    DATA.drink.ingredients.append(key)
                else if (key.includes("strMeasure"))
                    DATA.drink.quantities.append(key)
            });
        });
}

async function generateReadMe() {
    await fs.readFile(MUSTACHE_MAIN_DIR, (err, data) => {
        if (err) throw err;
        const output = Mustache.render(data.toString(), DATA);
        fs.writeFileSync('README.md', output);
    });
}

async function action() {
    //Fetch Weather
    await setWeatherInformation();

    //Get pictures
    await setInstagramPosts();

    //Get cocktail
    await getCocktail();

    //Generate README
    await generateReadMe();

    //Close resources
    await puppeteerService.close();
}

action();