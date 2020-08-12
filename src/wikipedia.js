import axios from 'axios'

export default class Wikipedia {
  static loadSummitPhoto (summit, size) {
    return axios.get('https://en.wikipedia.org/w/api.php', { params: {
      action: 'query',
      format: 'json',
      prop: 'coordinates|pageimages|info|pageviews',
      inprop: 'url',
      generator: 'geosearch',
      ggscoord: summit.coordinates.latitude + '|' + summit.coordinates.longitude,
      ggsradius: 500,
      origin: '*',
      pilicense: 'free'
    } }).then(pageimages => {
      if (!pageimages.data.query) {
        return null
      }

      // Filter and sort pages by distance from the summit coordinates
      let pages = []
      Object.keys(pageimages.data.query.pages).forEach(pageid => {
        let page = pageimages.data.query.pages[pageid]
        if (!page.coordinates[0] || !page.thumbnail || page.thumbnail.source.match(/relief|location_map/i)) {
          return
        }
        page.distance = this.calcDistance(page.coordinates[0].lat, page.coordinates[0].lon, summit.coordinates.latitude, summit.coordinates.longitude)
        pages.push(page)
      })

      pages.sort((a, b) => {
        return a.distance - b.distance
      })

      // Take all pages within 100 m of the closest page
      if (pages.length > 0) {
        let closestPage = pages[0]
        pages = pages.filter(page => {
          return (page.distance - closestPage.distance) < 0.1
        })
      }

      // Take the page with the most views from the remaining pages
      let bestPage
      let bestPageViews
      pages.forEach(page => {
        let pageViews = Object.values(page.pageviews).reduce((acc, val) => { return acc + val }, 0)

        if (!bestPage || (pageViews > bestPageViews)) {
          bestPage = page
          bestPageViews = pageViews
        }
      })

      if (bestPage) {
        // Fetch image info for attribution and description
        return axios.get('https://en.wikipedia.org/w/api.php', { params: {
          action: 'query',
          format: 'json',
          prop: 'imageinfo',
          iiprop: 'url|extmetadata',
          titles: 'file:' + bestPage.pageimage,
          iiurlwidth: size,
          iiurlheight: size,
          origin: '*'
        } }).then(imageinfo => {
          imageinfo = imageinfo.data.query.pages['-1'].imageinfo[0]
          let image = {
            width: imageinfo.thumbwidth,
            height: imageinfo.thumbheight,
            src: imageinfo.thumburl,
            link: bestPage.fullurl,
            title: bestPage.title,
            mediaLink: bestPage.fullurl + '#/media/File:' + bestPage.pageimage
          }

          if (imageinfo.extmetadata) {
            if (imageinfo.extmetadata.ImageDescription && imageinfo.extmetadata.ImageDescription.value) {
              image.description = this.stripHtml(imageinfo.extmetadata.ImageDescription.value).trim()
            }
            if (imageinfo.extmetadata.AttributionRequired && imageinfo.extmetadata.AttributionRequired.value === 'true') {
              let attribution = ''
              if (imageinfo.extmetadata.Attribution && imageinfo.extmetadata.Attribution.value) {
                attribution = this.stripHtml(imageinfo.extmetadata.Attribution.value)
              } else if (imageinfo.extmetadata.Artist) {
                attribution = this.stripHtml(imageinfo.extmetadata.Artist.value)
              }
              if (!attribution) {
                attribution = 'Wikipedia'
              }
              if (imageinfo.extmetadata.LicenseShortName) {
                attribution += ' [<a href="' + this.stripHtml(imageinfo.extmetadata.LicenseUrl.value) + '" target="_blank">' + this.stripHtml(imageinfo.extmetadata.LicenseShortName.value) + '</a>]'
              }
              if (attribution) {
                image.attribution = attribution
              }
            }
          }

          return image
        })
      } else {
        return null
      }
    })
  }

  static calcDistance (lat1, lon1, lat2, lon2) {
    let R = 6371
    let dLat = this.deg2rad(lat2 - lat1)
    let dLon = this.deg2rad(lon2 - lon1)
    let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    let d = R * c
    return d
  }

  static deg2rad (deg) {
    return deg * (Math.PI / 180)
  }

  static stripHtml (value) {
    let div = document.createElement('div')
    div.innerHTML = value
    let text = div.textContent || div.innerText || ''
    return text
  }
}
