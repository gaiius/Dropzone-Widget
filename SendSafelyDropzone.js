function SendSafelyDropzone (apiKey, $domElement, $urlElement) {
  this.url = 'https://app.sendsafely.com';

  this.INJECTED_TEXT = '\n\nThis ticket contains files uploaded using SendSafely. To view the attachments go to the below link:\n {url}';
  this.BACKGROUND_COLOR = '#ffffff';
  this.DROP_TEXT_COLOR = '#D1D1D1';
  this.WIDTH = '100%';

  this.iframeStartSize = 130;

  this.apiKey = apiKey;

  this.disableAutoSubmit = false;
  this.hasUploadedFiles = false;
  this.nbrOfFilesAttached = 0;

  this.dropZone = undefined;

  var myself = this;

  /*
  Private functions below this point.
   */
  this.initialize = function () {

    function createUploadURL(url) {
      url = url.replace('https://static-', 'https://');
      url = url.replace('http://static-', 'http://');
      return url;
    }

    // Clear out all css on the div
    $domElement.attr("style","");
    $domElement.removeClass();

    myself.createIFrameElement($domElement);

    myself.iframe.onload = function() {
      var win = myself.iframe.contentWindow;
      var hostUrl = myself.createStaticURL(myself.url);
      win.postMessage({command: 'api-key', key: myself.apiKey, color: myself.BACKGROUND_COLOR, textColor: myself.DROP_TEXT_COLOR}, hostUrl);

      myself.addFrameListener('file-attached', function() {
        // Resize the frame.
        myself.iframeStartSize += 23;
        myself.iframe.style.height = myself.iframeStartSize + "px";
        myself.nbrOfFilesAttached++;
      });
      myself.addFrameListener('file-removed', function() {
        // Resize the frame.
        myself.iframeStartSize -= 23;
        myself.iframe.style.height = myself.iframeStartSize + "px";
        myself.nbrOfFilesAttached--;
      });
    };

    if(myself.disableAutoSubmit !== true && myself.nbrOfFilesAttached > 0) {
      $('form').submit(function(event) {
        var $form = $(this);

        myself.finalizePackage(function (error, message) {
          if(error === undefined) {
            var text = myself.INJECTED_TEXT;
            text = text.replace('{url}', message);

            $urlElement.val(function(_, val){return val + text;});

            $form.submit();
          } else {
            alert(message);
          }
        });

        event.preventDefault();
      });
    }
  };

  this.createStaticURL = function (url) {
    if(url.indexOf("https://static-") < 0 && url.indexOf("https://") >= 0) {
      url = url.replace('https://', 'https://static-');
    }
    else if (url.indexOf("http://static-") < 0 && url.indexOf("http://") >= 0) {
      url = url.replace('http://', 'http://static-');
    }
    return url;
  };

  this.finalizePackage = function(callback) {

    myself.addFrameListener('package-link', function(data) {
      callback(data.url);
    });

    var win = myself.iframe.contentWindow;
    win.postMessage({command: 'finalize'}, myself.createStaticURL(myself.url));
  };

  this.addFrameListener = function(command, callback) {
    function listener(event){
      if(event.data.command == command) {
        callback(event.data);
      }
    }

    if (window.addEventListener){
      addEventListener("message", listener, false)
    } else {
      attachEvent("onmessage", listener)
    }
  }

  this.createIFrameElement = function (elem) {
    iframe = document.createElement("IFRAME");
    iframe.setAttribute("src", myself.createStaticURL(myself.url) + "/html/dropzone.html");
    iframe.style.width = myself.WIDTH;
    iframe.style.height = myself.iframeStartSize + "px";
    iframe.style.border = 'none';
    iframe.seamless = "seamless";
    iframe.frameBorder = "0px";
    iframe.scrolling="no";
    elem.html(iframe);

    myself.iframe = iframe;
  }
}