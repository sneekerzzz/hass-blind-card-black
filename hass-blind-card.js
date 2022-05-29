class BlindCard extends HTMLElement {
  set hass(hass) {
    const _this = this;
    const entities = this.config.entities;
    
    //Init the card
    if (!this.card) {
      const card = document.createElement('ha-card');


      if (this.config.title) {
          card.header = this.config.title;
      }
    
      this.card = card;
      this.appendChild(card);
    
      let allBlinds = document.createElement('div');
      allBlinds.className = 'sc-blinds';
      entities.forEach(function(entity) {
        let entityId = entity;
        if (entity && entity.entity) {
            entityId = entity.entity;
        }
        
        let buttonsPosition = 'left';
        if (entity && entity.buttons_position) {
            buttonsPosition = entity.buttons_position.toLowerCase();
        }
        
        let titlePosition = 'top';
        if (entity && entity.title_position) {
            titlePosition = entity.title_position.toLowerCase();
        }

        let invertPercentage = false;
        if (entity && entity.invert_percentage) {
          invertPercentage = entity.invert_percentage;
        }

        let blindColor = '#ffffff'
        if (entity && entity.blind_color) {
          blindColor = entity.blind_color;
        }
    
        let blind = document.createElement('div');

        blind.className = 'sc-blind';
        blind.dataset.blind = entityId;
        blind.innerHTML = `
          <div class="sc-blind-top" ` + (titlePosition == 'bottom' ? 'style="display:none;"' : '') + `>
            <div class="sc-blind-label">
            
            </div>
            <div class="sc-blind-position">
            
            </div>
          </div>
          <div class="sc-blind-middle" style="flex-direction: ` + (buttonsPosition == 'right' ? 'row-reverse': 'row') + `;">
            <div class="sc-blind-buttons">
              <ha-icon-button class="sc-blind-button" data-command="up"><ha-icon icon="mdi:arrow-up"></ha-icon></ha-icon-button><br>
              <ha-icon-button class="sc-blind-button" data-command="stop"><ha-icon icon="mdi:stop"></ha-icon></ha-icon-button><br>
              <ha-icon-button class="sc-blind-button" data-command="down"><ha-icon icon="mdi:arrow-down"></ha-icon></ha-icon-button>
            </div>
            <div class="sc-blind-selector">
              <div class="sc-blind-selector-picture">
                <div class="sc-blind-selector-slide"></div>
                <div class="sc-blind-selector-picker"></div>
              </div>
            </div>
          </div>
          <div class="sc-blind-bottom" ` + (titlePosition != 'bottom' ? 'style="display:none;"' : '') + `>
            <div class="sc-blind-label">
            
            </div>
            <div class="sc-blind-position">
            
            </div>
          </div>
        `;
        
        let picture = blind.querySelector('.sc-blind-selector-picture');
        let slide = blind.querySelector('.sc-blind-selector-slide');
        let picker = blind.querySelector('.sc-blind-selector-picker');

        slide.style.background = blindColor ;
        
        let mouseDown = function(event) {
            if (event.cancelable) {
              //Disable default drag event
              event.preventDefault();
            }
            
            _this.isUpdating = true;
            
            document.addEventListener('mousemove', mouseMove);
            document.addEventListener('touchmove', mouseMove);
            document.addEventListener('pointermove', mouseMove);
      
            document.addEventListener('mouseup', mouseUp);
            document.addEventListener('touchend', mouseUp);
            document.addEventListener('pointerup', mouseUp);
        };
  
        let mouseMove = function(event) {
          let newPosition = event.pageY - _this.getPictureTop(picture);
          _this.setPickerPosition(newPosition, picker, slide);
        };
           
        let mouseUp = function(event) {
          _this.isUpdating = false;
            
          let newPosition = event.pageY - _this.getPictureTop(picture);
          
          if (newPosition < _this.minPosition)
            newPosition = _this.minPosition;
          
          if (newPosition > _this.maxPosition)
            newPosition = _this.maxPosition;
          
          let percentagePosition = (newPosition - _this.minPosition) * 100 / (_this.maxPosition - _this.minPosition);
          
          if (invertPercentage) {
            _this.updateBlindPosition(hass, entityId, percentagePosition);
          } else {
            _this.updateBlindPosition(hass, entityId, 100 - percentagePosition);
          }
          
          document.removeEventListener('mousemove', mouseMove);
          document.removeEventListener('touchmove', mouseMove);
          document.removeEventListener('pointermove', mouseMove);
      
          document.removeEventListener('mouseup', mouseUp);
          document.removeEventListener('touchend', mouseUp);
          document.removeEventListener('pointerup', mouseUp);
        };
      
        //Manage slider update
        picker.addEventListener('mousedown', mouseDown);
        picker.addEventListener('touchstart', mouseDown);
        picker.addEventListener('pointerdown', mouseDown);
        
        //Manage click on buttons
        blind.querySelectorAll('.sc-blind-button').forEach(function (button) {
            button.onclick = function () {
                const command = this.dataset.command;
                
                let service = '';
                
                switch (command) {
                  case 'up':
                      service = 'open_cover';
                      break;
                      
                  case 'down':
                      service = 'close_cover';
                      break;
                
                  case 'stop':
                      service = 'stop_cover';
                      break;
                }
                
                hass.callService('cover', service, {
                  entity_id: entityId
                });
            };
        });
      
        allBlinds.appendChild(blind);
      });
      
      
      const style = document.createElement('style');
      style.textContent = `
        .sc-blinds { padding: 16px; }
          .sc-blind { margin-top: 1rem; overflow: hidden; }
          .sc-blind:first-child { margin-top: 0; }
          .sc-blind-middle { display: flex; max-width: 210px; width: 100%; margin: auto; }
            .sc-blind-buttons { flex: 0; text-align: center; margin-top: 0.4rem; }
            .sc-blind-selector { flex: 1; }
              .sc-blind-selector-picture { position: relative; margin: auto; background-size: 100% 100%; background-repeat: no-repeat; min-height: 151px; max-height: 100%; width: 100%; max-width: 153px; }
                .sc-blind-selector-picture { background-image: url(data:@file/png;base64,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bnMuYWRvYmUuY29tL3RpZmYvMS4wLyIKICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgeG1wTU06RG9jdW1lbnRJRD0iZ2ltcDpkb2NpZDpnaW1wOmRkZTQyY2EzLWU5YTUtNGJiMy05NTkzLTFiMTgyMmNhYzIxNSIKICAgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDplNTU0NTVmNi04YjNmLTRlZGItYjFhZS1mNmMxYWVlMTZkMTIiCiAgIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo5NjJmYzk1Zi1jNTg1LTRlODYtOGYwMy1kYTI1MTYxMTgzODkiCiAgIEdJTVA6QVBJPSIyLjAiCiAgIEdJTVA6UGxhdGZvcm09IldpbmRvd3MiCiAgIEdJTVA6VGltZVN0YW1wPSIxNjUzODQ1NTA5NDI2ODUwIgogICBHSU1QOlZlcnNpb249IjIuMTAuMzAiCiAgIGRjOkZvcm1hdD0iaW1hZ2UvcG5nIgogICB0aWZmOk9yaWVudGF0aW9uPSIxIgogICB4bXA6Q3JlYXRvclRvb2w9IkdJTVAgMi4xMCI+CiAgIDx4bXBNTTpIaXN0b3J5PgogICAgPHJkZjpTZXE+CiAgICAgPHJkZjpsaQogICAgICBzdEV2dDphY3Rpb249InNhdmVkIgogICAgICBzdEV2dDpjaGFuZ2VkPSIvIgogICAgICBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmYxMDRlZTE4LTdkY2EtNGU3Ny04OTEyLTBkZDM0OGM2MmIyYSIKICAgICAgc3RFdnQ6c29mdHdhcmVBZ2VudD0iR2ltcCAyLjEwIChXaW5kb3dzKSIKICAgICAgc3RFdnQ6d2hlbj0iMjAyMi0wNS0yOVQxODozMTo0OSIvPgogICAgPC9yZGY6U2VxPgogICA8L3htcE1NOkhpc3Rvcnk+CiAgPC9yZGY6RGVzY3JpcHRpb24+CiA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgCjw/eHBhY2tldCBlbmQ9InciPz4BK3uPAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAB3RJTUUH5gUdER8x5zqV7gAAAVtJREFUeNrt2kEKgzAQQNFJ8TKBbnN/CgYXOUlPkZ7ApIKloO+BK3fDZ8aFEQDARIqIbgz80sMIEBkiA5EhMkQGIkNkIDJEhshAZIgMkcEJlmfOpoBNhshAZPxfHzwwVNftXV911FCf/eOfjJEDy8q5xDcZIgORITJEBiJDZCAyRIbIQGSIDJGByBAZiAyRITIQGSJDZCAyRAYiQ2SIDESGyBAZiAyRgcgQGSIDkSEyRAYiQ2QgMkSGyEBkiAxEhsgQGYgMkSEyEBkiA5EhMkQGIkNkiAxEhshAZIgMkYHIEBkiA5EhMhAZIkNkIDJEhshAZIgMRIbIEBmIDJEhMhAZIgORITJEBiJDZIgMRIbIQGSIDJGByBAZIgORITIQGSJDZCAyRIbIQGSIDESGyBAZiAyRITIQGSIDkSEyrihFRN97WUoxIb7SWrPJcC6567kEmwyRgcgQGdfwAX27HhTaZxyHAAAAAElFTkSuQmCC=); }
              .sc-blind-selector-slide { background-color: #ffffff; position: absolute; top: 19px; left: 3.921568%; width: 92.156862%; height: 0; }
              .sc-blind-selector-picker { position: absolute; top: 19px; left: 2.941176%; width: 94.117647%; cursor: pointer; height: 20px; background-repeat: no-repeat; }
                .sc-blind-selector-picker { background-image: url(data:@file/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJQAAAAHCAYAAADuzmQ5AAAABGdBTUEAALGeYUxB9wAAACBjSFJNAACHCwAAjBIAAP70AAB/DgAAgQYAAOhBAAA54AAAHiqESS3PAAAA22lDQ1BJQ0MgUHJvZmlsZQAAKM9jYGB8wAAETECcm1dSFOTupBARGaXAfoGBEQjBIDG5uMA32C2EASf4dg2i9rIuA+mAs7ykoARIfwBikaKQIGegm1iAbL50CFsExE6CsFVA7CKgA4FsE5D6dAjbA8ROgrBjQOzkgiKgmYwFIPNTUouTgewGIDsB5DeItZ9ZwW5mFFVKLi0qg7qFkcmYgYEQH2FGHjsDg9lVBgbm/Qix1G4Ghm0nGRjE5RBiykC3CyUyMOxIKkmtKEH2PMRtYMCWXwAMfQZqAgYGAC7ONG+WT8jJAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAB5klEQVRYR+2XwWrCQBCGs2li7KmQCqJ46qVv0KeofRZfpM/Qk4fqQ0jRkydBBKGnHnopNmJiAjFp0v9Ps2UrEmyLtEI+GGYzOzMbsz+bKObzeadWq91qJSW/wPf9O8/zZmIymXTr9XrbNM0q4inQhBAfWcWkMAO5ES/gN6xDfTVJkhOEYoY5V/L/Ufed3rKsLBaG4Zc5iYzpus5x4jjOwnXdoRiNRv1Go9E2DMOSibsaFMGG+TADtXo+LDki1L2nUAh0oUVRtFMTjOWCSiEmZ71eD8R4PL5vtVo3KKwyQdq+gkLuGxwFxVOJp5Y8ueBKjg3ufRzHWqVSyTwFhTdONlcgqGS5XC7wynsQ0+m032w222iQnVD7ojRzsZCBRSlprmjiujyhjhApJgqHe0u/LSIVqQHsfYpXngNBDfjK6+Kj/Fp+QzGxqIkEzVI009EsQD7FyNoNzKQhniBOcFlyCLihNMLn/JNnLXuwFj6FoNjEkv1gIdPgSVYjYV1+qCSr1eoVghqKXq/XsW37CoIymQAdZEl7wF9yDouxUB3mo/6J94TYqdrnGz3/HHmv8uHJZ0LUuITzpCjnUGzv1/a9F6HUYphmDeA91D7DXjDmn6wL+DNMPcJf4tqGfX4vK+vxG8oNgmD2Di0RPo9DidC/AAAAAElFTkSuQmCC); }
          .sc-blind-top { text-align: center; margin-bottom: 1rem; }
          .sc-blind-bottom { text-align: center; margin-top: 1rem; }
            .sc-blind-label { display: inline-block; font-size: 20px; vertical-align: middle; }
            .sc-blind-position { display: inline-block; vertical-align: middle; padding: 0 6px; margin-left: 1rem; border-radius: 2px; background-color: var(--secondary-background-color); }
      `;
    
      this.card.appendChild(allBlinds);
      this.appendChild(style);
    }
    
    //Update the blinds UI
    entities.forEach(function(entity) {
      let entityId = entity;
      if (entity && entity.entity) {
        entityId = entity.entity;
      }

      let invertPercentage = false;
      if (entity && entity.invert_percentage) {
        invertPercentage = entity.invert_percentage;
      }
        
      const blind = _this.card.querySelector('div[data-blind="' + entityId +'"]');
      const slide = blind.querySelector('.sc-blind-selector-slide');
      const picker = blind.querySelector('.sc-blind-selector-picker');
        
      const state = hass.states[entityId];
      const friendlyName = (entity && entity.name) ? entity.name : state ? state.attributes.friendly_name : 'unknown';
      const currentPosition = state ? state.attributes.current_position : 'unknown';

      blind.querySelectorAll('.sc-blind-label').forEach(function(blindLabel) {
          blindLabel.innerHTML = friendlyName;
      })
      
      if (!_this.isUpdating) {
        blind.querySelectorAll('.sc-blind-position').forEach(function (blindPosition) {
          blindPosition.innerHTML = currentPosition + '%';
        })

        if (invertPercentage) {
          _this.setPickerPositionPercentage(currentPosition, picker, slide);
        } else {
          _this.setPickerPositionPercentage(100 - currentPosition, picker, slide);
        }
      }
    });
  }
  
  getPictureTop(picture) {
      let pictureBox = picture.getBoundingClientRect();
      let body = document.body;
      let docEl = document.documentElement;

      let scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;

      let clientTop = docEl.clientTop || body.clientTop || 0;

      let pictureTop  = pictureBox.top + scrollTop - clientTop;
      
      return pictureTop;
  }
  
  setPickerPositionPercentage(position, picker, slide) {
    let realPosition = (this.maxPosition - this.minPosition) * position / 100 + this.minPosition;
  
    this.setPickerPosition(realPosition, picker, slide);
  }


  setPickerPosition(position, picker, slide) {
    if (position < this.minPosition)
      position = this.minPosition;
  
    if (position > this.maxPosition)
      position = this.maxPosition;
  

    picker.style.top = position + 'px';
    slide.style.height = position - this.minPosition + 'px';
  }
  
  updateBlindPosition(hass, entityId, position) {
    let blindPosition = Math.round(position);
  
    hass.callService('cover', 'set_cover_position', {
      entity_id: entityId,
      position: blindPosition
    });
  }

  setConfig(config) {
    if (!config.entities) {
      throw new Error('You need to define entities');
    }
    
    this.config = config;
    this.maxPosition = 137;
    this.minPosition = 19;
    this.isUpdating = false;
  }

  // The height of your card. Home Assistant uses this to automatically
  // distribute all cards over the available columns.
  getCardSize() {
    return this.config.entities.length + 1;
  }
}

customElements.define("blind-card", BlindCard);
