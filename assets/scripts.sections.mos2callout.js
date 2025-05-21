import {KSnavigation,KSautoPlay,KScenterSlides} from "\/\/store-pruebas-teipe.myshopify.com\/cdn\/shop\/t\/20\/assets\/scripts.keenSlider.plugins.js?v=162808386765211230481747773323"

export class MOS2Callout { 

  constructor({sliderElement,showArrows,perView,autoplaySpeed,useSliderAtDesktop,useSliderAtMobile}){ 
    this.sliderElement = sliderElement
    this.useSliderAtDesktop = useSliderAtDesktop
    this.useSliderAtMobile = useSliderAtMobile

    this.sliderSettings = {
      loop: false,
      slides: { 
        perView:perView, 
        spacing:0 
      },
      autoplaySpeed:autoplaySpeed,
      // hide rather than show so we don't effect other instances of arrows
      hideArrows:!showArrows,
      defaultAnimation:{
        duration:1000,
      },
      breakpoints: {
        '(min-width: 640px)': {
          slides: { 
            perView: perView + 1
          }
        },
        '(min-width: 1024px)': {
          slides: { 
            perView:perView + 2
          }
        },
      }
    }

    if(document.readyState == 'interactive' || document.readyState == 'complete' ){
      this.bind()
    }else{
      document.addEventListener('DOMContentLoaded', () => {
        this.bind()
      })
    }
  }

  initSlider(){
    if(!this.slider){
      this.sliderElement.classList.remove('grid--flex')
      this.sliderElement.removeAttribute('data-keen-slider-disabled')
      this.slider = new KeenSlider(this.sliderElement,this.sliderSettings, [KSnavigation,KSautoPlay,KScenterSlides])
      Array.from(this.slider.slides).forEach(slide => {
        const aosAttr = slide.getAttribute('data-aos')
        if(aosAttr){
          slide.removeAttribute('data-aos')
          slide.setAttribute('data-aos_disabled',aosAttr)
        }
      })
    }else{
      this.slider.emit('update')
    }
  }

  destroySlider(){
    if(this.slider){
      Array.from(this.slider.slides).forEach(slide => {
        const aosAttr = slide.getAttribute('data-aos_disabled')
        if(aosAttr){
          slide.removeAttribute('data-aos_disabled')
          slide.setAttribute('data-aos',aosAttr)
        }
      })
      this.slider.destroy()
      this.slider = false
      this.sliderElement.classList.add('grid--flex')
      this.sliderElement.setAttribute('data-keen-slider-disabled',true)
    }
  }

  toggleSlider(){
    const vpWidth =  window.innerWidth
    if(this.useSliderAtDesktop && vpWidth > 1023 || this.useSliderAtMobile && vpWidth < 1024){
      this.initSlider()
    }else{
      this.destroySlider()
    }
  }

  bind(){
    let timeout = null
    window.addEventListener('resize',() => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        this.toggleSlider()
      },500)
    })

    this.toggleSlider()
  }
}
