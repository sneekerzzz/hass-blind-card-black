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
                .sc-blind-selector-picture { background-image: url(data:image/png;base64,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OTczYS1lMDIxLTQxZGItYmY3MC0zNGUxYmM4OWZlZmIiCiAgIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MWZkNzYwMTEtMmVjOS00ODdjLTg2ZmEtZmUxZDJjMWYzMmFkIgogICB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6YzEyMzU3ZTctYjJlZi00OTRlLTljNDYtNzJlMjliOTJiZDJmIgogICBHSU1QOkFQST0iMi4wIgogICBHSU1QOlBsYXRmb3JtPSJXaW5kb3dzIgogICBHSU1QOlRpbWVTdGFtcD0iMTY1Mzg1MDY3NjkwMjQ1OCIKICAgR0lNUDpWZXJzaW9uPSIyLjEwLjMwIgogICBkYzpGb3JtYXQ9ImltYWdlL3BuZyIKICAgdGlmZjpPcmllbnRhdGlvbj0iMSIKICAgeG1wOkNyZWF0b3JUb29sPSJHSU1QIDIuMTAiPgogICA8eG1wTU06SGlzdG9yeT4KICAgIDxyZGY6U2VxPgogICAgIDxyZGY6bGkKICAgICAgc3RFdnQ6YWN0aW9uPSJzYXZlZCIKICAgICAgc3RFdnQ6Y2hhbmdlZD0iLyIKICAgICAgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDpmN2MwYzk0MC01NTA0LTRmMTctOTI0Ny0zZDVhYWI3MTdkMmUiCiAgICAgIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkdpbXAgMi4xMCAoV2luZG93cykiCiAgICAgIHN0RXZ0OndoZW49IjIwMjItMDUtMjlUMTk6NTc6NTYiLz4KICAgIDwvcmRmOlNlcT4KICAgPC94bXBNTTpIaXN0b3J5PgogIDwvcmRmOkRlc2NyaXB0aW9uPgogPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgIAo8P3hwYWNrZXQgZW5kPSJ3Ij8+Vi7oAAAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAAOxAAADsQBlSsOGwAAAAd0SU1FB+YFHRI5OF9+EDcAAAFJSURBVHja7drBCYAwEEXBH0lHmv4LSFGxAjUIIujM1dvy2PWQBAC4UJIMY+BJixEgMkQGIkNkiAxEhshAZIgMkcG12rbVFLDJEBmc8tQHmwyRgch4X534Z4MZwybDuURkIDJEhshAZIgMRIbIEBmIDJEhMhAZIgORITJEBiJDZIgMRIbIQGSIDJGByBAZIjMCRIbIQGSIDJGByBAZiAyRITIQGSJDZCAyRAYiQ2SIDESGyBAZiAyRgcgQGSIDkSEyRAYiQ2QgMkSGyEBkiAyRgcgQGYgMkSEyEBkiQ2QgMkQGIkNkiAxEhsgQGYgMkYHIEBkiA5EhMkQGIkNkIDJEhshAZIgMkYHIEBmIDJEhMhAZIkNkIDJEBiJDZIgMRIbIEBmIDJGByBAZIoN7SpJx9LG1ZkJM6b3bZDiX/PVcgk2GyEBkiIxv2AFmownBRVD1nwAAAABJRU5ErkJggg==); }
              .sc-blind-selector-slide { background-color: #ffffff; position: absolute; top: 19px; left: 3.921568%; width: 92.156862%; height: 0; }
              .sc-blind-selector-picker { position: absolute; top: 19px; left: 2.941176%; width: 94.117647%; cursor: pointer; height: 20px; background-repeat: no-repeat; }
                .sc-blind-selector-picker { background-image: url(data:image/png;base64,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IgogICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iCiAgICB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iCiAgIHhtcE1NOkRvY3VtZW50SUQ9ImdpbXA6ZG9jaWQ6Z2ltcDplYTNjZTc1NS1kYTEyLTRlZjgtYjYxMS00OGU5NGJiOWY0NzMiCiAgIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6OWNlMzI5NDEtYTFlZC00NGFkLThlOWYtZWQyOGM1NzNiZDE3IgogICB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6MjZlYWQzZjQtNWVlZC00NDBjLThhYmItYmEyZTgxMjFlM2YyIgogICBHSU1QOkFQST0iMi4wIgogICBHSU1QOlBsYXRmb3JtPSJXaW5kb3dzIgogICBHSU1QOlRpbWVTdGFtcD0iMTY1Mzg1MTkwOTI5MDU3MSIKICAgR0lNUDpWZXJzaW9uPSIyLjEwLjMwIgogICBkYzpGb3JtYXQ9ImltYWdlL3BuZyIKICAgdGlmZjpPcmllbnRhdGlvbj0iMSIKICAgeG1wOkNyZWF0b3JUb29sPSJHSU1QIDIuMTAiPgogICA8eG1wTU06SGlzdG9yeT4KICAgIDxyZGY6U2VxPgogICAgIDxyZGY6bGkKICAgICAgc3RFdnQ6YWN0aW9uPSJzYXZlZCIKICAgICAgc3RFdnQ6Y2hhbmdlZD0iLyIKICAgICAgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDowMWMyY2Q4NS04Y2NhLTQwZDQtYjZmYi01MWU3NjU4MjdiMjEiCiAgICAgIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkdpbXAgMi4xMCAoV2luZG93cykiCiAgICAgIHN0RXZ0OndoZW49IjIwMjItMDUtMjlUMjA6MTg6MjkiLz4KICAgIDwvcmRmOlNlcT4KICAgPC94bXBNTTpIaXN0b3J5PgogIDwvcmRmOkRlc2NyaXB0aW9uPgogPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgIAo8P3hwYWNrZXQgZW5kPSJ3Ij8+qreBjgAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAAOxAAADsQBlSsOGwAAAAd0SU1FB+YFHRMSHWPIUy4AAABYSURBVEjH7dfJDcAgDERRmyLGHbgK0n8toQk45RiQ4JTovxLGlhfPzG7ARAmJFPAqJCvEgOUkIQKs+OlN8qyruzXS/MDq2KnV0U1Cg/y/qUIyv2rlu8HUAE+3DvFHwqJWAAAAAElFTkSuQmCC); }
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
  // distribute all cards over the available columns12.
  getCardSize() {
    return this.config.entities.length + 1;
  }
}

customElements.define("blind-card", BlindCard);
