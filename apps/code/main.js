export function init(app) {
  try {
    var element = app.appInstance.querySelector(".code");
    var workarea = element.querySelector(".code__workarea");
    var explore = element.querySelector(".code__explore");

    function loadFile(callback, path, typy) {
      var xobj = new XMLHttpRequest();
      if (typy) {
        xobj.overrideMimeType(typy);
      }
      xobj.open("GET", path, true);
      xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
          callback(xobj.responseText);
        }
      };
      xobj.send(null);
    }

    loadFile(
      renderFileList,
      "https://api.github.com/repos/MaiconSlavieiro/portfolio/contents",
      "application/json"
    );

    function renderFileList(response) {
      processContent(response);
      var content = JSON.parse(response);
      app.contentResponse = content;
    }

    function processContent(response, parentElement) {
      var content = JSON.parse(response);
      var elmParent = parentElement || explore;
      var hasParent = parentElement ? true : false;
      content.forEach(element => {
        if (element.type == "dir") {
          var elm = createExploreElement(element, hasParent, true);
          elmParent.appendChild(elm);
          loadFile(function (response) {
            processContent(response, elm);
          }, element.url, "application/json");
        } else {
          elmParent.appendChild(createExploreElement(element, hasParent, false));
        }
      });
    }

    function createExploreElement(item, hasParent, isFolder) {
      var elm_class = isFolder
        ? "code__explore__folder"
        : "code__explore__file";
      var type = hasParent ? "li" : "ul";
      var elm = document.createElement(type);
      elm.classList.add(elm_class);
      elm.classList.add("code__explore__item");
      var span_name_file = document.createElement("div");
      span_name_file.innerText = item.name;

      elm.appendChild(span_name_file);
      if (isFolder) {
        span_name_file.classList.add("code__explore__item__icon", "folder");
        span_name_file.addEventListener(
          "click",
          function () {
            var folderContent = elm.children;
            this.classList.toggle("folder");
            this.classList.toggle("open_folder");
            for (let index = 0; index < folderContent.length; index++) {
              const element = folderContent[index];
              if (element != this) {
                element.classList.toggle("visible");
              }
            }
          },
          false
        );
      } else {
        var fileName = item.download_url;
        var extension = fileName.split('.').pop();
        span_name_file.classList.add("code__explore__item__icon", extension);
        span_name_file.addEventListener(
          "click",
          function () {
            loadFile(
              createViewContent,
              item.download_url
            );

            var last_selected = explore.querySelector(".selected");
            if (last_selected) {
              last_selected.classList.remove("selected");
            }


            elm.classList.add("selected");

            function createViewContent(data) {
              workarea.innerHTML = "";

              if (extension == 'js' || extension == "html" || extension == "css" || extension == "less" || extension == "json") {
                var content = document.createElement("div");
                content.classList.add("code__workarea__content");
                var container = document.createElement("div");
                container.classList.add("code__workarea__content__code");
                container.innerText = data;
                content.appendChild(container);
                workarea.appendChild(content);
              } else if (extension == 'svg') {
                var content = document.createElement("div");
                content.classList.add("code__workarea__content");
                content.innerHTML = data;
                workarea.appendChild(content);
              } else if (extension == 'png' || extension == 'jpeg' || extension == 'jpg') {
                var img = document.createElement("img");
                img.src = item.download_url;
                img.classList.add("code__workarea__img");
                workarea.appendChild(img);
              } else {
                var downlaodButton = document.createElement("a");
                downlaodButton.classList.add("button", "large", "light");
                downlaodButton.href = item.download_url;
                //downlaodButton.target = "_blank";
                downlaodButton.innerText = "Download"
                workarea.appendChild(downlaodButton);
              }

            }
          },
          false
        );


      }

      if (!hasParent) {
        elm.classList.toggle("visible");
      }

      return elm;
    }
  } catch (e) { }
}
