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
                .sc-blind-selector-picture { background-image: url(data:image/png;base64,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cy5hZG9iZS5jb20vdGlmZi8xLjAvIgogICAgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIgogICB4bXBNTTpEb2N1bWVudElEPSJnaW1wOmRvY2lkOmdpbXA6MTUxNjNlNGMtNTIwNC00MjQyLTg0ODItZjk4NTI4NjJhZjkyIgogICB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjI2ZGRkNjI1LWU1NTAtNGRiOS1iNGUyLTc1N2NlOGViMzQ5OSIKICAgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjg1YWM5YzJmLTE2MzctNDFmNi04YjMzLTU2OWU2ZDE0MzYwNCIKICAgR0lNUDpBUEk9IjIuMCIKICAgR0lNUDpQbGF0Zm9ybT0iV2luZG93cyIKICAgR0lNUDpUaW1lU3RhbXA9IjE2NTM4NDczMjI1ODYxMzkiCiAgIEdJTVA6VmVyc2lvbj0iMi4xMC4zMCIKICAgZGM6Rm9ybWF0PSJpbWFnZS9wbmciCiAgIHRpZmY6T3JpZW50YXRpb249IjEiCiAgIHhtcDpDcmVhdG9yVG9vbD0iR0lNUCAyLjEwIj4KICAgPHhtcE1NOkhpc3Rvcnk+CiAgICA8cmRmOlNlcT4KICAgICA8cmRmOmxpCiAgICAgIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiCiAgICAgIHN0RXZ0OmNoYW5nZWQ9Ii8iCiAgICAgIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6NmY1YWZmMjUtYzFiZC00Mzg4LWEzYjAtNzlkOTFkYzE3M2Y1IgogICAgICBzdEV2dDpzb2Z0d2FyZUFnZW50PSJHaW1wIDIuMTAgKFdpbmRvd3MpIgogICAgICBzdEV2dDp3aGVuPSIyMDIyLTA1LTI5VDE5OjAyOjAyIi8+CiAgICA8L3JkZjpTZXE+CiAgIDwveG1wTU06SGlzdG9yeT4KICA8L3JkZjpEZXNjcmlwdGlvbj4KIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAKPD94cGFja2V0IGVuZD0idyI/Pskwe5EAAAAGYktHRAD/AP8A/6C9p5MAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAAHdElNRQfmBR0SAgKlwCa9AAABW0lEQVR42u3aQQqDMBBA0UnxMoFuc38KBhc5SU+RnsCkgqWg74Erd8NnxoURAMBEiohuDPzSwwgQGSIDkSEyRAYiQ2QgMkSGyEBkiAyRwQmWZ86mgE2GyEBk/F8fPDBU1+1dX3XUUJ/945+MkQPLyrnENxkiA5EhMkQGIkNkIDJEhshAZIgMkYHIEBmIDJEhMhAZIkNkIDJEBiJDZIgMRIbIEBmIDJGByBAZIgORITJEBiJDZCAyRIbIQGSIDESGyBAZiAyRITIQGSIDkSEyRAYiQ2SIDESGyEBkiAyRgcgQGSIDkSEyEBkiQ2QgMkSGyEBkiAxEhsgQGYgMkSEyEBkiA5EhMkQGIkNkiAxEhshAZIgMkYHIEBkiA5EhMhAZIkNkIDJEhshAZIgMRIbIEBmIDJEhMhAZIgORITKuKEVE33tZSjEhvtJas8lwLrnruQSbDJGByBAZ1/ABfbseFNpnHIcAAAAASUVORK5CYII=); }
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
