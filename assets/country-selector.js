
class CountriesData {

  constructor(){

    this.countries = false
    this.ObserverLite = new ObserverLite()

    if(window.location.href.indexOf("www.medik8") > -1) {
      //Use the ISO Alph 2 standard - please refer to countries.json file
      this.market = "GB"
    }else if (window.location.href.indexOf("us.medik8") > -1) {
      this.market = "US"
    }else if (window.location.href.indexOf("de.medik8") > -1) {
      this.market = "DE"
    }else if (window.location.href.indexOf("eu.medik8") > -1) {
      this.market = "EU"
    }else if (window.location.href.indexOf("int.medik8") > -1) {
      this.market = "INT"
    }else {
      //For distributors - set domain to be the same as isoAlpha2 in the json file and define the market metafield in shopify
      this.market = window.default_market;
    }

    fetch("//store-pruebas-teipe.myshopify.com/cdn/shop/t/20/assets/countries.json?v=114130126609068580151747773322")
      .then(response => response.json())
      .then(data => {
      this.countries = data
      this.next()
    })
  }

  get currentCountry(){
    const currentCountry = !this.countries ? false : this.countries.filter(({zone}) => zone == this.market )
    return currentCountry ? currentCountry[0] : false
  }

  subscribe(callback){
    return this.ObserverLite.subscribe(callback)
  }
  
  next(data){
    this.ObserverLite.next(data)
  }

  getCountry(key,value){
    let item = this.countries.filter( (country) => {
      if(Array.isArray(country[key])){
        return country[key].some( val => val == value)
      }
      return country[key] == value
    })
    return item.length ? item[0] : false
  }

}

// set as a global variable so we can use it in toggle and gelocation popup
window.countriesData = new CountriesData()


// Requires a global instance of CountriesData e.g. window.countriesData = new CountriesData()
class GlobalCountySelector extends HTMLElement {

  constructor() { 
    super(); 
    this.show = false
  }

  connectedCallback(){
    if(this.id){
      return
    }
    this.countriesData = window.countriesData
    if(!this.countriesData.countries){
      this.countriesData.subscribe( () => {
        this.populateToggle()
      })
    }else{
      this.populateToggle()
    }
  }

  subscribe(callback){
    return this.ObserverLite.subscribe(callback)
  }
  
  next(data){
    this.ObserverLite.next(data)
  }


  htmlToNode(html) {
    var template = document.createElement('template');
    html = html.trim()
    template.innerHTML = html
    return template.content.firstChild
  }


  toggle(close){
    // if dropdown not rendered, render it
    if(!this.listIsRendered && !close){
      this.listIsRendered = true
      this.populateCountryList()
    }
    if(this.show || close){
      this.show = false
      this.countries_dropdown.style.display = 'none'
    }else{
      this.show = true
      this.countries_dropdown.style.display = 'block'
    }
  }

  populateToggle(){
    if(this.countriesData.currentCountry){
      const html = `<div data-country-toggle class="country-selector__active">
                      <div class="country-flag">
                         <img loading="lazy" src="data:image/svg+xml;base64,${this.countriesData.currentCountry.flag}" width="100" height="100" alt="${this.countriesData.currentCountry.name} flag" />
                      </div>
                    <div class="country country-name">${this.countriesData.currentCountry.name}</div>`
      this.country_toggle = this.htmlToNode(html)
      this.append(this.country_toggle)

      this.country_toggle.addEventListener('click', () => {
        this.toggle()
      })
    }
  }
  
  populateCountryList(){
    const countryOptionsHtml = this.countriesData.countries.filter(({id}) => id && id > 2).map(country => {
      return `<a data-filter-item data-filter-name="${country.name}" href="${country.website}">
                <div class="country-flag">
                  <img loading="lazy" src="data:image/svg+xml;base64,${country.flag}" width="100" height="100" alt="${country.name} flag" />
                </div>
                <div class="country country-name">${country.name}</div>
                <div class="flag-currency push">${country.currency}</div>
              </a>`
    }).join('')

    const dropDownHtml = `<div data-country-dropdown class="country-selector__dropdown" style="display: none;">
                            <button class="country-selectorClose">
                              <i class="wayfx-icon wayfx-icon-close-thin"></i>
                            </button>
                            <div class="country-header">
                            <h6 class="delivery-title">EVIAR A</h6>
                            <span class="country-search-wrapper">
                              <input class="country-search" data-search type="text" placeholder="Search for location..."/>
                            </span>
                          </div>
                          <div class="country-container">
                            <div data-countries-wrapper class="countries-wrapper">${countryOptionsHtml}</div>
                            <div class="country-footer">
                              <small>
                                <a href="https://www.medik8.com/pages/find-local-store-skincare">¿No puedes encontrar tu país?</a>
                              </small>
                            </div>
                          </div>
                        </div>`
    
    this.countries_dropdown = this.htmlToNode(dropDownHtml)
    this.country_toggle.after(this.countries_dropdown)
 
    this.querySelector('[data-search]').addEventListener('keyup',({target}) => {
        var searchVal = target.value.toLowerCase()
        var filterItems = this.querySelectorAll('[data-filter-item]')
    
        filterItems.forEach((item) => {
          item.style.display = item.textContent.toLowerCase().includes(searchVal) ? '' : 'none'
        })

    })

    document.addEventListener('mouseup',(e) => {
      if (!e.target.closest('.country-selector')) {
        this.toggle(true)
      }
    })

    document.querySelectorAll('.country-selectorClose').forEach( elem =>  elem.addEventListener('click',(e) => {
      e.preventDefault(
        this.toggle(true)
      )
    }))
    
    window.addEventListener('scroll', () => {
      this.toggle(true)
    })
    
  }
}

customElements.define('global-country-selector', GlobalCountySelector);



// helper to load geolcation data, currently only loaded when modal is enabled but can be moved out and used in other context if needed
class GeoLocator {

  constructor(){
    this.id =  Math.floor(Math.random() * 999999999999)
    this.lsKey = `gbl_loco_key` 
    this.ObserverLite = new ObserverLite()
    const params = this.getParams()
    if(params.relocate){
      this.setLs('doNotRelocate',true)
    }
    const lsData = this.getLs()
    if(!lsData.doNotRelocate){
      this.getLocation().then( (data) => {
        this.locationData = data
        this.next()
      })
    }
  }

  getParams(e) {
    var r = {},
    t = document.createElement("a")
    t.href = e
    for (var n = t.search.substring(1).split("&"), a = 0; a < n.length; a++) {
      var o = n[a].split("=");
      r[o[0]] = decodeURIComponent(o[1])
    }
    return r
  }

  setLs(key,value){
    let data = window.localStorage.getItem(this.lsKey) ? JSON.parse(window.localStorage.getItem(this.lsKey)) : {}
    data[key] = value
    data = JSON.stringify(data)
    window.localStorage.setItem(this.lsKey,data)
  }

  getLs(){
    let data = window.localStorage.getItem(this.lsKey) ? JSON.parse(window.localStorage.getItem(this.lsKey)) : {}
    return data
  }

  subscribe(callback){
    return this.ObserverLite.subscribe(callback)
  }
  
  next(data){
    this.ObserverLite.next(data)
  }

  getLocation(){
    return new Promise((resolve,reject) => {
      fetch('https://api.bigdatacloud.net/data/reverse-geocode-client')
      .then( response => response.json() )
      .then( data => {
        resolve(data)
      }).catch(err => {
        reject(err)
      })
    })
  }
}

// builds fancybox for redirect modal. Requires a global instance of CountriesData e.g. window.countriesData = new CountriesData() 







function buildJqFancyBoxLocationModal(recomendedCountry,currentCountry,geoLocator){
  const modalContent = `<div style="text-align:center;overflow:visible;width:100%;max-width:512px;">
                          <h3 class="h3--secondary row">Parece que quieres enviar a ${recomendedCountry.name}</h3>                         
                          <a href="${recomendedCountry.website}?redirect=true" class="btn btn--xlarge btn--full row--d2">Enviar a ${recomendedCountry.name}</a>
                          <button class="btn btn--xlarge btn--full row--d2" data-fancybox-close>Estoy en ${currentCountry.name}</button>
                          <button class="js-show-store-toggle">Elegir a otro país</button>
                        </div>`
  $(function(){
    $.fancybox.open(modalContent,{
      touch : false,
      modal: false,
      showCloseButton: true, 
      baseClass:'country-selector-fancybox',
      afterShow:function(){
        $('.js-show-store-toggle').click(function(){
          $(this).replaceWith('<div class="flex justify-center"><global-country-selector class="country-selector"></global-country-selector></div>');
        })
      },
      afterClose: function() {
        geoLocator.setLs('doNotRelocate',true)
      }
   })
  })
}

// Subscribe to the countries data + fire geolocator
window.countriesData.subscribe( () => {
  const geoLocator = new GeoLocator()
  geoLocator.subscribe( () => {
    if(window.countriesData.currentCountry.isoAlpha2 != geoLocator.locationData.countryCode){
      let recomendedCountry = window.countriesData.getCountry('isoAlpha2' , geoLocator.locationData.countryCode)
      if(recomendedCountry?.zone != countriesData.currentCountry?.zone){
        buildJqFancyBoxLocationModal(recomendedCountry,window.countriesData.currentCountry,geoLocator)
      }
    }
  })
})




