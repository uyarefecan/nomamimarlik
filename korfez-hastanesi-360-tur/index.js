'use strict';

(function() {
  var Marzipano = window.Marzipano;
  var bowser = window.bowser;
  var screenfull = window.screenfull;
  var data = window.APP_DATA;

  // Grab elements from DOM.
  var panoElement = document.querySelector('#pano');
  // var sceneNameElement = document.querySelector('#titleBar .sceneName');
  var sceneNameTextElement = document.querySelector('#titleBar .sceneName #sceneNameText');
  var sceneListElement = document.querySelector('#sceneList');
  var sceneElements = document.querySelectorAll('#sceneList .scene');
  var sceneListToggleElement = document.querySelector('#sceneListToggle');
  // var autorotateToggleElement = document.querySelector('#autorotateToggle');
  // var fullscreenToggleElement = document.querySelector('#fullscreenToggle');

  var infoSection = document.querySelector('#infoSection');
  var infoButtonElement = document.querySelector('#infoButton');
  var infoSectionCloseButtonElement = document.querySelector('#infoSectionCloseButton');
  var infoSectionText = document.querySelector('#infoSectionText');

  // Detect desktop or mobile mode.
  if (window.matchMedia) {
    var setMode = function() {
      if (mql.matches) {
        document.body.classList.remove('desktop');
        document.body.classList.add('mobile');
      } else {
        document.body.classList.remove('mobile');
        document.body.classList.add('desktop');
      }
    };
    var mql = matchMedia("(max-width: 500px), (max-height: 500px)");
    setMode();
    mql.addListener(setMode);
  } else {
    document.body.classList.add('desktop');
  }

  // Detect whether we are on a touch device.
  document.body.classList.add('no-touch');
  window.addEventListener('touchstart', function() {
    document.body.classList.remove('no-touch');
    document.body.classList.add('touch');
  });

  // Use tooltip fallback mode on IE < 11.
  if (bowser.msie && parseFloat(bowser.version) < 11) {
    document.body.classList.add('tooltip-fallback');
  }

  // Viewer options.
  var viewerOpts = {
    controls: {
      mouseViewMode: data.settings.mouseViewMode
    }
  };

  // Initialize viewer.
  var viewer = new Marzipano.Viewer(panoElement, viewerOpts);

  // Create scenes.
  var scenes = data.scenes.map(function(data) {
    var urlPrefix = "korfez-hastanesi-360-tur/tiles";
    var source = Marzipano.ImageUrlSource.fromString(
      urlPrefix + "/" + data.id + "/{z}/{f}/{y}/{x}.jpg",
      { cubeMapPreviewUrl: urlPrefix + "/" + data.id + "/preview.jpg" });
    var geometry = new Marzipano.CubeGeometry(data.levels);

    var limiter = Marzipano.RectilinearView.limit.traditional(data.faceSize, 100*Math.PI/180, 120*Math.PI/180);
    var view = new Marzipano.RectilinearView(data.initialViewParameters, limiter);

    var scene = viewer.createScene({
      source: source,
      geometry: geometry,
      view: view,
      pinFirstLevel: true
    });

    // Create link hotspots.
    data.linkHotspots.forEach(function(hotspot) {
      var element = createLinkHotspotElement(hotspot);
      scene.hotspotContainer().createHotspot(element, { yaw: hotspot.yaw, pitch: hotspot.pitch });
    });

    // Create info hotspots.
    data.infoHotspots.forEach(function(hotspot) {
      var element = createInfoHotspotElement(hotspot);
      scene.hotspotContainer().createHotspot(element, { yaw: hotspot.yaw, pitch: hotspot.pitch });
    });

    return {
      data: data,
      scene: scene,
      view: view
    };
  });

  // Set up autorotate, if enabled.
  var autorotate = Marzipano.autorotate({
    yawSpeed: 0.03,
    targetPitch: 0,
    targetFov: Math.PI/2
  });
  // if (data.settings.autorotateEnabled) {
  //   autorotateToggleElement.classList.add('enabled');
  // }

  // Set handler for autorotate toggle.
  // autorotateToggleElement.addEventListener('click', toggleAutorotate);

  // Set up fullscreen mode, if supported.
  if (screenfull.enabled && data.settings.fullscreenButton) {
    document.body.classList.add('fullscreen-enabled');
    // fullscreenToggleElement.addEventListener('click', function() {
    //   screenfull.toggle();
    // });
    // screenfull.on('change', function() {
    //   if (screenfull.isFullscreen) {
    //     fullscreenToggleElement.classList.add('enabled');
    //   } else {
    //     fullscreenToggleElement.classList.remove('enabled');
    //   }
    // });
  } else {
    document.body.classList.add('fullscreen-disabled');
  }

  // Set handler for scene list toggle.
  sceneListToggleElement.addEventListener('click', toggleSceneList);

  // Start with the scene list open on desktop.
  if (!document.body.classList.contains('mobile')) {
    showSceneList();
  }

  // Set handler for scene switch.
  scenes.forEach(function(scene) {
    var el = document.querySelector('#sceneList .scene[data-id="' + scene.data.id + '"]');
    el.addEventListener('click', function() {
      switchScene(scene);
      closeInfo();
      // On mobile, hide scene list after selecting a scene.
      if (document.body.classList.contains('mobile')) {
        hideSceneList();
      }
    });
  });

  infoButtonElement.addEventListener('click', infoEvent);
  infoSectionCloseButtonElement.addEventListener('click', infoEvent);

  // DOM elements for view controls.
  var viewUpElement = document.querySelector('#viewUp');
  var viewDownElement = document.querySelector('#viewDown');
  var viewLeftElement = document.querySelector('#viewLeft');
  var viewRightElement = document.querySelector('#viewRight');
  var viewInElement = document.querySelector('#viewIn');
  var viewOutElement = document.querySelector('#viewOut');

  // Dynamic parameters for controls.
  var velocity = 0.7;
  var friction = 3;

  // Associate view controls with elements.
  var controls = viewer.controls();
  controls.registerMethod('upElement',    new Marzipano.ElementPressControlMethod(viewUpElement,     'y', -velocity, friction), true);
  controls.registerMethod('downElement',  new Marzipano.ElementPressControlMethod(viewDownElement,   'y',  velocity, friction), true);
  controls.registerMethod('leftElement',  new Marzipano.ElementPressControlMethod(viewLeftElement,   'x', -velocity, friction), true);
  controls.registerMethod('rightElement', new Marzipano.ElementPressControlMethod(viewRightElement,  'x',  velocity, friction), true);
  controls.registerMethod('inElement',    new Marzipano.ElementPressControlMethod(viewInElement,  'zoom', -velocity, friction), true);
  controls.registerMethod('outElement',   new Marzipano.ElementPressControlMethod(viewOutElement, 'zoom',  velocity, friction), true);

  function sanitize(s) {
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;');
  }

  function switchScene(scene) {
    stopAutorotate();
    scene.view.setParameters(scene.data.initialViewParameters);
    scene.scene.switchTo();
    startAutorotate();
    updateSceneName(scene);
    updateSceneList(scene);
  }

  function updateSceneName(scene) {
    sceneNameTextElement.innerHTML = sanitize(scene.data.name);
  }

  function updateSceneList(scene) {
    for (var i = 0; i < sceneElements.length; i++) {
      var el = sceneElements[i];
      if (el.getAttribute('data-id') === scene.data.id) {
        el.classList.add('current');
      } else {
        el.classList.remove('current');
      }
    }
  }

  function showSceneList() {
    sceneListElement.classList.add('enabled');
    sceneListToggleElement.classList.add('enabled');
  }

  function hideSceneList() {
    sceneListElement.classList.remove('enabled');
    sceneListToggleElement.classList.remove('enabled');
  }

  function toggleSceneList() {
    sceneListElement.classList.toggle('enabled');
    sceneListToggleElement.classList.toggle('enabled');
  }

  let sceneArray = {
    '0-ana-giri': '??ZEL EDREM??T K??RFEZ HASTANES?? HAKKINDA<br><br>' +
    '&emsp;Kuzey Ege B??lgesinde sa??l??k alan??nda t??m bran??larda (dahili ve cerrahi ) ' +
    'hissedilen eksiklikler nedeniyle planlan??p b??lgenin gereksinimlerine uygun olarak 2010 ' +
    'y??l??nda hizmet vermeye ba??layan A s??n??f?? bir hastane olarak ??evre il ve il??elerde ba??ta ' +
    'olmak ??zere Bal??kesir Edremit K??rfez B??lgesinin en modern ve en kapsaml?? sa??l??k kurulu??lar??ndan biridir.<br><br>' +
    '&emsp;Yakla????k 11 bin metrekare kapal?? alana kurulu olan hastanemiz; 28???i yo??un bak??m olmak ??zere toplam 93 hasta yata????, ' +
    'tam te??ekk??ll?? genel yo??un bak??m, kardiyovask??ler cerrahi yo??un bak??m, koroner yo??un bak??m, cerrahi yo??un bak??m ve ' +
    'yenido??an yo??un bak??m servisleri ve modern ameliyathaneleri, do??umhaneleri, fizik tedavi ve rehabilitasyon servisi, ' +
    'di?? a????z ve ??ene cerrahisi ??nitesi, modern radyoloji g??r??nt??leme merkezi, t??bbi biyokimya ve mikrobiyoloji laboratuvarlar??' +
    'ile hemen hemen t??m bran??larda SGK, anla??mal?? ??zel sigorta ve kurumlarla poliklinik, yatarak te??his ve tedavi hizmeti sunmaktad??r.<br><br>' +
    '&emsp;Hastanemizde t??m hasta ve misafirlerimizin kullanabilece??i ??cretsiz otoparklar??m??z hizmet vermektedir.<br><br>' +
    '&emsp;Otopark??m??zda bir??ok bankaya ait bankamatik bulunmaktad??r.<br><br>' +
    '&emsp;Hastanemiz ??anakkale-??zmir Karayolu??zerinde, Edremit???e 3.Km mesafededir.'
    ,
    '1-giri': '??ZEL EDREM??T K??RFEZ HASTANES?? HAKKINDA<br><br>' +
    '&emsp;Kuzey Ege B??lgesinde sa??l??k alan??nda t??m bran??larda (dahili ve cerrahi ) ' +
    'hissedilen eksiklikler nedeniyle planlan??p b??lgenin gereksinimlerine uygun olarak 2010 ' +
    'y??l??nda hizmet vermeye ba??layan A s??n??f?? bir hastane olarak ??evre il ve il??elerde ba??ta ' +
    'olmak ??zere Bal??kesir Edremit K??rfez B??lgesinin en modern ve en kapsaml?? sa??l??k kurulu??lar??ndan biridir.<br><br>' +
    '&emsp;Yakla????k 11 bin metrekare kapal?? alana kurulu olan hastanemiz; 28???i yo??un bak??m olmak ??zere toplam 93 hasta yata????, ' +
    'tam te??ekk??ll?? genel yo??un bak??m, kardiyovask??ler cerrahi yo??un bak??m, koroner yo??un bak??m, cerrahi yo??un bak??m ve ' +
    'yenido??an yo??un bak??m servisleri ve modern ameliyathaneleri, do??umhaneleri, fizik tedavi ve rehabilitasyon servisi, ' +
    'di?? a????z ve ??ene cerrahisi ??nitesi, modern radyoloji g??r??nt??leme merkezi, t??bbi biyokimya ve mikrobiyoloji laboratuvarlar??' +
    'ile hemen hemen t??m bran??larda SGK, anla??mal?? ??zel sigorta ve kurumlarla poliklinik, yatarak te??his ve tedavi hizmeti sunmaktad??r.<br><br>' +
    '&emsp;Hastanemizde t??m hasta ve misafirlerimizin kullanabilece??i ??cretsiz otoparklar??m??z hizmet vermektedir.<br><br>' +
    '&emsp;Otopark??m??zda bir??ok bankaya ait bankamatik bulunmaktad??r.<br><br>' +
    '&emsp;Hastanemiz ??anakkale-??zmir Karayolu??zerinde, Edremit???e 3.Km mesafededir.'
    ,
    '2-danma': '??ZEL EDREM??T K??RFEZ HASTANES?? HAKKINDA<br><br>' +
    '&emsp;Kuzey Ege B??lgesinde sa??l??k alan??nda t??m bran??larda (dahili ve cerrahi ) ' +
    'hissedilen eksiklikler nedeniyle planlan??p b??lgenin gereksinimlerine uygun olarak 2010 ' +
    'y??l??nda hizmet vermeye ba??layan A s??n??f?? bir hastane olarak ??evre il ve il??elerde ba??ta ' +
    'olmak ??zere Bal??kesir Edremit K??rfez B??lgesinin en modern ve en kapsaml?? sa??l??k kurulu??lar??ndan biridir.<br><br>' +
    '&emsp;Yakla????k 11 bin metrekare kapal?? alana kurulu olan hastanemiz; 28???i yo??un bak??m olmak ??zere toplam 93 hasta yata????, ' +
    'tam te??ekk??ll?? genel yo??un bak??m, kardiyovask??ler cerrahi yo??un bak??m, koroner yo??un bak??m, cerrahi yo??un bak??m ve ' +
    'yenido??an yo??un bak??m servisleri ve modern ameliyathaneleri, do??umhaneleri, fizik tedavi ve rehabilitasyon servisi, ' +
    'di?? a????z ve ??ene cerrahisi ??nitesi, modern radyoloji g??r??nt??leme merkezi, t??bbi biyokimya ve mikrobiyoloji laboratuvarlar??' +
    'ile hemen hemen t??m bran??larda SGK, anla??mal?? ??zel sigorta ve kurumlarla poliklinik, yatarak te??his ve tedavi hizmeti sunmaktad??r.<br><br>' +
    '&emsp;Hastanemizde t??m hasta ve misafirlerimizin kullanabilece??i ??cretsiz otoparklar??m??z hizmet vermektedir.<br><br>' +
    '&emsp;Otopark??m??zda bir??ok bankaya ait bankamatik bulunmaktad??r.<br><br>' +
    '&emsp;Hastanemiz ??anakkale-??zmir Karayolu??zerinde, Edremit???e 3.Km mesafededir.'
    ,
    '3-bekleme-alan': '??ZEL EDREM??T K??RFEZ HASTANES?? HAKKINDA<br><br>' +
    '&emsp;Kuzey Ege B??lgesinde sa??l??k alan??nda t??m bran??larda (dahili ve cerrahi ) ' +
    'hissedilen eksiklikler nedeniyle planlan??p b??lgenin gereksinimlerine uygun olarak 2010 ' +
    'y??l??nda hizmet vermeye ba??layan A s??n??f?? bir hastane olarak ??evre il ve il??elerde ba??ta ' +
    'olmak ??zere Bal??kesir Edremit K??rfez B??lgesinin en modern ve en kapsaml?? sa??l??k kurulu??lar??ndan biridir.<br><br>' +
    '&emsp;Yakla????k 11 bin metrekare kapal?? alana kurulu olan hastanemiz; 28???i yo??un bak??m olmak ??zere toplam 93 hasta yata????, ' +
    'tam te??ekk??ll?? genel yo??un bak??m, kardiyovask??ler cerrahi yo??un bak??m, koroner yo??un bak??m, cerrahi yo??un bak??m ve ' +
    'yenido??an yo??un bak??m servisleri ve modern ameliyathaneleri, do??umhaneleri, fizik tedavi ve rehabilitasyon servisi, ' +
    'di?? a????z ve ??ene cerrahisi ??nitesi, modern radyoloji g??r??nt??leme merkezi, t??bbi biyokimya ve mikrobiyoloji laboratuvarlar??' +
    'ile hemen hemen t??m bran??larda SGK, anla??mal?? ??zel sigorta ve kurumlarla poliklinik, yatarak te??his ve tedavi hizmeti sunmaktad??r.<br><br>' +
    '&emsp;Hastanemizde t??m hasta ve misafirlerimizin kullanabilece??i ??cretsiz otoparklar??m??z hizmet vermektedir.<br><br>' +
    '&emsp;Otopark??m??zda bir??ok bankaya ait bankamatik bulunmaktad??r.<br><br>' +
    '&emsp;Hastanemiz ??anakkale-??zmir Karayolu??zerinde, Edremit???e 3.Km mesafededir.'
    ,
    '4-kafeterya': '??ZEL EDREM??T K??RFEZ HASTANES?? HAKKINDA<br><br>' +
    '&emsp;Kuzey Ege B??lgesinde sa??l??k alan??nda t??m bran??larda (dahili ve cerrahi ) ' +
    'hissedilen eksiklikler nedeniyle planlan??p b??lgenin gereksinimlerine uygun olarak 2010 ' +
    'y??l??nda hizmet vermeye ba??layan A s??n??f?? bir hastane olarak ??evre il ve il??elerde ba??ta ' +
    'olmak ??zere Bal??kesir Edremit K??rfez B??lgesinin en modern ve en kapsaml?? sa??l??k kurulu??lar??ndan biridir.<br><br>' +
    '&emsp;Yakla????k 11 bin metrekare kapal?? alana kurulu olan hastanemiz; 28???i yo??un bak??m olmak ??zere toplam 93 hasta yata????, ' +
    'tam te??ekk??ll?? genel yo??un bak??m, kardiyovask??ler cerrahi yo??un bak??m, koroner yo??un bak??m, cerrahi yo??un bak??m ve ' +
    'yenido??an yo??un bak??m servisleri ve modern ameliyathaneleri, do??umhaneleri, fizik tedavi ve rehabilitasyon servisi, ' +
    'di?? a????z ve ??ene cerrahisi ??nitesi, modern radyoloji g??r??nt??leme merkezi, t??bbi biyokimya ve mikrobiyoloji laboratuvarlar??' +
    'ile hemen hemen t??m bran??larda SGK, anla??mal?? ??zel sigorta ve kurumlarla poliklinik, yatarak te??his ve tedavi hizmeti sunmaktad??r.<br><br>' +
    '&emsp;Hastanemizde t??m hasta ve misafirlerimizin kullanabilece??i ??cretsiz otoparklar??m??z hizmet vermektedir.<br><br>' +
    '&emsp;Otopark??m??zda bir??ok bankaya ait bankamatik bulunmaktad??r.<br><br>' +
    '&emsp;Hastanemiz ??anakkale-??zmir Karayolu??zerinde, Edremit???e 3.Km mesafededir.'
    ,
    '5-acil-girii': '<br><br><br>Acil Servisimiz her t??rl?? sa??l??k ihtiyac??na zaman??nda ve etkin cevap verebilmek amac??yla yeterli say??da uzman doktor ve yard??mc?? '+
    'sa??l??k personeliyle 7 g??n 24 saat hizmet vermektedir. 6 g??zlem odas??, 2 yatakl?? acil m??dehale/giri??im odas??, triaj odas??, 1 al???? '+
    'odas?? ile hizmet veren acil serviste 24 saat CT, MRI, R??ntgen ve t??bbi laboratuar tahlilleri yap??lmaktad??r.'
    ,
    '6-rntgen': '<br><br><br>Radyoloji g??r??nt??leme merkezinde; R??ntgen, Renkli Doppler Ultrasonografi, Digital Mamografi, Digital Floroskopi, Kemik Dansitometresi, '+
    'Bilgisayarl?? Tomografi(CT), 1,5 Tesla Manyetik Rezonans G??r??nt??leme(MRI) ileri teknolojik cihazlarla hastal??klar??n te??hisi i??in kullan??lmakta ve '+
    'PACS teknolojisiyle t??m hekimlerimizin hizmetine sunulmaktad??r.'
    ,
    '7-ultrasonografi': '<br><br><br>Radyoloji g??r??nt??leme merkezinde; R??ntgen, Renkli Doppler Ultrasonografi, Digital Mamografi, Digital Floroskopi, Kemik Dansitometresi, '+
    'Bilgisayarl?? Tomografi(CT), 1,5 Tesla Manyetik Rezonans G??r??nt??leme(MRI) ileri teknolojik cihazlarla hastal??klar??n te??hisi i??in kullan??lmakta ve '+
    'PACS teknolojisiyle t??m hekimlerimizin hizmetine sunulmaktad??r.'
    ,
    '8-mamografi': '<br><br><br>Radyoloji g??r??nt??leme merkezinde; R??ntgen, Renkli Doppler Ultrasonografi, Digital Mamografi, Digital Floroskopi, Kemik Dansitometresi, '+
    'Bilgisayarl?? Tomografi(CT), 1,5 Tesla Manyetik Rezonans G??r??nt??leme(MRI) ileri teknolojik cihazlarla hastal??klar??n te??hisi i??in kullan??lmakta ve '+
    'PACS teknolojisiyle t??m hekimlerimizin hizmetine sunulmaktad??r.'
    ,
    '9-floroskopi': '<br><br><br>Radyoloji g??r??nt??leme merkezinde; R??ntgen, Renkli Doppler Ultrasonografi, Digital Mamografi, Digital Floroskopi, Kemik Dansitometresi, '+
    'Bilgisayarl?? Tomografi(CT), 1,5 Tesla Manyetik Rezonans G??r??nt??leme(MRI) ileri teknolojik cihazlarla hastal??klar??n te??hisi i??in kullan??lmakta ve '+
    'PACS teknolojisiyle t??m hekimlerimizin hizmetine sunulmaktad??r.'
    ,
    '10-kemik-densitometresi': '<br><br><br>Radyoloji g??r??nt??leme merkezinde; R??ntgen, Renkli Doppler Ultrasonografi, Digital Mamografi, Digital Floroskopi, Kemik Dansitometresi, '+
    'Bilgisayarl?? Tomografi(CT), 1,5 Tesla Manyetik Rezonans G??r??nt??leme(MRI) ileri teknolojik cihazlarla hastal??klar??n te??hisi i??in kullan??lmakta ve '+
    'PACS teknolojisiyle t??m hekimlerimizin hizmetine sunulmaktad??r.'
    ,
    '11-bilgisayarl-tomografi-ct': '<br><br><br>Radyoloji g??r??nt??leme merkezinde; R??ntgen, Renkli Doppler Ultrasonografi, Digital Mamografi, Digital Floroskopi, Kemik Dansitometresi, '+
    'Bilgisayarl?? Tomografi(CT), 1,5 Tesla Manyetik Rezonans G??r??nt??leme(MRI) ileri teknolojik cihazlarla hastal??klar??n te??hisi i??in kullan??lmakta ve '+
    'PACS teknolojisiyle t??m hekimlerimizin hizmetine sunulmaktad??r.'
    ,
    '12-manyetin-rezonans-grntleme-mri': '<br><br><br>Radyoloji g??r??nt??leme merkezinde; R??ntgen, Renkli Doppler Ultrasonografi, Digital Mamografi, Digital Floroskopi, Kemik Dansitometresi, '+
    'Bilgisayarl?? Tomografi(CT), 1,5 Tesla Manyetik Rezonans G??r??nt??leme(MRI) ileri teknolojik cihazlarla hastal??klar??n te??hisi i??in kullan??lmakta ve '+
    'PACS teknolojisiyle t??m hekimlerimizin hizmetine sunulmaktad??r.'
    ,
    '13-bokmya-ve-mkrobyoloj-laboratuvari': '<br><br><br>En ileri teknolojik cihazlar kullan??larak hastalardan al??nan her t??rl?? numunelerle hastal??k te??hi??lerine y??nelik tetkikler en k??sa '+
    's??rede uluslararas?? kalite g??vencesi kurallar?? uygulanarak neticelendirilmektedir.'
    ,
    '14-bokmya-ve-mkrobyoloj-laboratuvari-2': '<br><br><br>En ileri teknolojik cihazlar kullan??larak hastalardan al??nan her t??rl?? numunelerle hastal??k te??hi??lerine y??nelik tetkikler en k??sa '+
    's??rede uluslararas?? kalite g??vencesi kurallar?? uygulanarak neticelendirilmektedir.'
    ,
    '15-eswl-bbrek-tai-kirma-ntes': '<br><br><br>Kuzey Ege B??lgesinde b??y??k bir eksikli??in giderilmesi amac??yla kurulmu?? ve Uzman Hekimlerimiz taraf??ndan uygulamas?? yap??larak hizmete sunulmu??tur. '
    ,
    '16-di-poliklinii': '<br><br><br>Bu ??nitemizde 2 di?? hekimi ??ene ve a????z cerrahi uzman?? ile Panoramik r??ntgen, Panoramik bilgisayarl?? Tomografi ve di??er modern di?? ekipmanlar??yla, a????z ??ene cerrahisi, '+
    't??m di?? tedavileri, di?? implantlar?? ve protezleri yap??lmaktad??r.'
    ,
    '17-az-ve-ene-cerrahisi-poliklinii': '<br><br><br>Bu ??nitemizde 2 di?? hekimi ??ene ve a????z cerrahi uzman?? ile Panoramik r??ntgen, Panoramik bilgisayarl?? Tomografi ve di??er modern di?? ekipmanlar??yla, a????z ??ene cerrahisi, '+
    't??m di?? tedavileri, di?? implantlar?? ve protezleri yap??lmaktad??r.'
    ,
    '18-panaromik-tomografi': '<br><br><br>Bu ??nitemizde 2 di?? hekimi ??ene ve a????z cerrahi uzman?? ile Panoramik r??ntgen, Panoramik bilgisayarl?? Tomografi ve di??er modern di?? ekipmanlar??yla, a????z ??ene cerrahisi, '+
    't??m di?? tedavileri, di?? implantlar?? ve protezleri yap??lmaktad??r.'
    ,
    '25-kadn-doum-ve-hastalklar-poliklinii': '<br><br><br>Kad??n Do??um ve Hastal??klar?? Poliklini??i ( D??rt boyutlu  General Elektrik Volusen E80 Renkli Doppler USG ile  geli??mi?? uygulama ve ??st??n g??r??nt?? kalitesiyle '+
    't??m hamilelik s??reci boyunca takibi sa??lar, g??nl??k rutin i??lemlerden karma????k i??lemlere kadar olu??abilecek problemlere m??mk??n oldu??unca erken m??dahale edebilmek i??in te??his ve erken tedaviye olanak '+
    'sunan d??nyadaki en ileri teknolojiyi kullanmaktad??r).'
    ,
    '26-kadn-doum-ve-hastalklar-poliklinii-2': '<br><br><br>Kad??n Do??um ve Hastal??klar?? Poliklini??i ( D??rt boyutlu  General Elektrik Volusen E80 Renkli Doppler USG ile  geli??mi?? uygulama ve ??st??n g??r??nt?? kalitesiyle '+
    't??m hamilelik s??reci boyunca takibi sa??lar, g??nl??k rutin i??lemlerden karma????k i??lemlere kadar olu??abilecek problemlere m??mk??n oldu??unca erken m??dahale edebilmek i??in te??his ve erken tedaviye olanak '+
    'sunan d??nyadaki en ileri teknolojiyi kullanmaktad??r).'
    ,
    '27-gz-poliklinii': '<br><br><br>G??z poliklinik odalar?? (G??z hastal??klar??n??n te??his ve tedavisi amac??yla anjiografi, bilgisayarl?? g??z tomografisi (Optik Koherans Tomografi) dahil olmak ??zere ileri teknolojik cihazlarla '+
    'donat??lm???? olup 3 uzman hekimimiz taraf??ndan hizmet verilmekte ve her t??rl?? g??z hastal??klar??na y??nelik operasyonlar hastanemizde ger??ekle??tirilmektedir). Optik Koherans Tomografi d??????k enerjili laser ??????nlar?? '+
    'kullan??larak g??ze dokunmadan ve radyasyona maruz b??rak??lmadan zarar vermeden yap??lan g??z??n retina tabakas?? ve g??rme sinirinin taranmas??yla retina, sar?? nokta, glokom gibi bir??ok hastal??????n te??his ve takibinde '+
    'kullan??lan g??venilir bir tetkiktir.'
    ,
    '28-gz-poliklinii-2': '<br><br><br>G??z poliklinik odalar?? (G??z hastal??klar??n??n te??his ve tedavisi amac??yla anjiografi, bilgisayarl?? g??z tomografisi (Optik Koherans Tomografi) dahil olmak ??zere ileri teknolojik cihazlarla '+
    'donat??lm???? olup 3 uzman hekimimiz taraf??ndan hizmet verilmekte ve her t??rl?? g??z hastal??klar??na y??nelik operasyonlar hastanemizde ger??ekle??tirilmektedir). Optik Koherans Tomografi d??????k enerjili laser ??????nlar?? '+
    'kullan??larak g??ze dokunmadan ve radyasyona maruz b??rak??lmadan zarar vermeden yap??lan g??z??n retina tabakas?? ve g??rme sinirinin taranmas??yla retina, sar?? nokta, glokom gibi bir??ok hastal??????n te??his ve takibinde '+
    'kullan??lan g??venilir bir tetkiktir.'
    ,
    '29-gz-poliklinii-3': '<br><br><br>G??z poliklinik odalar?? (G??z hastal??klar??n??n te??his ve tedavisi amac??yla anjiografi, bilgisayarl?? g??z tomografisi (Optik Koherans Tomografi) dahil olmak ??zere ileri teknolojik cihazlarla '+
    'donat??lm???? olup 3 uzman hekimimiz taraf??ndan hizmet verilmekte ve her t??rl?? g??z hastal??klar??na y??nelik operasyonlar hastanemizde ger??ekle??tirilmektedir). Optik Koherans Tomografi d??????k enerjili laser ??????nlar?? '+
    'kullan??larak g??ze dokunmadan ve radyasyona maruz b??rak??lmadan zarar vermeden yap??lan g??z??n retina tabakas?? ve g??rme sinirinin taranmas??yla retina, sar?? nokta, glokom gibi bir??ok hastal??????n te??his ve takibinde '+
    'kullan??lan g??venilir bir tetkiktir.'
    ,
    '30-gz-poliklinii-4': '<br><br><br>G??z poliklinik odalar?? (G??z hastal??klar??n??n te??his ve tedavisi amac??yla anjiografi, bilgisayarl?? g??z tomografisi (Optik Koherans Tomografi) dahil olmak ??zere ileri teknolojik cihazlarla '+
    'donat??lm???? olup 3 uzman hekimimiz taraf??ndan hizmet verilmekte ve her t??rl?? g??z hastal??klar??na y??nelik operasyonlar hastanemizde ger??ekle??tirilmektedir). Optik Koherans Tomografi d??????k enerjili laser ??????nlar?? '+
    'kullan??larak g??ze dokunmadan ve radyasyona maruz b??rak??lmadan zarar vermeden yap??lan g??z??n retina tabakas?? ve g??rme sinirinin taranmas??yla retina, sar?? nokta, glokom gibi bir??ok hastal??????n te??his ve takibinde '+
    'kullan??lan g??venilir bir tetkiktir.'
    ,
    '32-doumhane': '<br><br><br>Hastanemizde 2 modern do??um odas?? mevcuttur.'
    ,
    '43-fizik-tedavi-ve-rehabilitasyon': '<br><br><br>Fizik Tedavi ve Rehabilitasyon Servisi; En iyi ko??ullarda hizmet vermek amac??yla ileri teknolojik cihazlarla donat??larak hastalar??n g??nl??k ya??am aktivitelerini geri '+
    'kazanmalar??, ??al????ma ve sosyal ya??amlar??na etkin bir ??ekilde devam edebilmeleri i??in hastaya ??zel yakla????mlarla, randevu sistemi uygulanarak, omurilik yaralanmalar??, inme (beden felci), kafa ya da di??er '+
    'v??cut travmalar?? sonras?? olu??an yaralanmalar, spor yaralanmalar??, romatolojik hastal??klar, multiple sklerozis dahil olmak ??zere di??er n??rolojik kas ve sinir sistemi hastal??klar??, operasyon ??ncesi ve sonras?? '+
    'ortopedik rehabilitasyonlar uzman hekimlerimiz ve fizyoterapistlerimiz taraf??ndan tedavi edilmektedirler.'
    ,
    '44-fizik-tedavi-ve-rehabilitasyon-2': '<br><br><br>Fizik Tedavi ve Rehabilitasyon Servisi; En iyi ko??ullarda hizmet vermek amac??yla ileri teknolojik cihazlarla donat??larak hastalar??n g??nl??k ya??am aktivitelerini geri '+
    'kazanmalar??, ??al????ma ve sosyal ya??amlar??na etkin bir ??ekilde devam edebilmeleri i??in hastaya ??zel yakla????mlarla, randevu sistemi uygulanarak, omurilik yaralanmalar??, inme (beden felci), kafa ya da di??er '+
    'v??cut travmalar?? sonras?? olu??an yaralanmalar, spor yaralanmalar??, romatolojik hastal??klar, multiple sklerozis dahil olmak ??zere di??er n??rolojik kas ve sinir sistemi hastal??klar??, operasyon ??ncesi ve sonras?? '+
    'ortopedik rehabilitasyonlar uzman hekimlerimiz ve fizyoterapistlerimiz taraf??ndan tedavi edilmektedirler.'
    ,
    '45-fizik-tedavi-ve-rehabilitasyon-3': '<br><br><br>Fizik Tedavi ve Rehabilitasyon Servisi; En iyi ko??ullarda hizmet vermek amac??yla ileri teknolojik cihazlarla donat??larak hastalar??n g??nl??k ya??am aktivitelerini geri '+
    'kazanmalar??, ??al????ma ve sosyal ya??amlar??na etkin bir ??ekilde devam edebilmeleri i??in hastaya ??zel yakla????mlarla, randevu sistemi uygulanarak, omurilik yaralanmalar??, inme (beden felci), kafa ya da di??er '+
    'v??cut travmalar?? sonras?? olu??an yaralanmalar, spor yaralanmalar??, romatolojik hastal??klar, multiple sklerozis dahil olmak ??zere di??er n??rolojik kas ve sinir sistemi hastal??klar??, operasyon ??ncesi ve sonras?? '+
    'ortopedik rehabilitasyonlar uzman hekimlerimiz ve fizyoterapistlerimiz taraf??ndan tedavi edilmektedirler.'
    ,
    '46-fizik-tedavi-ve-rehabilitasyon-odas': '<br><br><br>Fizik Tedavi ve Rehabilitasyon Servisi; En iyi ko??ullarda hizmet vermek amac??yla ileri teknolojik cihazlarla donat??larak hastalar??n g??nl??k ya??am aktivitelerini geri '+
    'kazanmalar??, ??al????ma ve sosyal ya??amlar??na etkin bir ??ekilde devam edebilmeleri i??in hastaya ??zel yakla????mlarla, randevu sistemi uygulanarak, omurilik yaralanmalar??, inme (beden felci), kafa ya da di??er '+
    'v??cut travmalar?? sonras?? olu??an yaralanmalar, spor yaralanmalar??, romatolojik hastal??klar, multiple sklerozis dahil olmak ??zere di??er n??rolojik kas ve sinir sistemi hastal??klar??, operasyon ??ncesi ve sonras?? '+
    'ortopedik rehabilitasyonlar uzman hekimlerimiz ve fizyoterapistlerimiz taraf??ndan tedavi edilmektedirler.'
    ,
    '49-kardiovaskler-cerrahi-ameliyathanesi': '<br><br><br>Birisi Kardiovask??ler Cerrahi Ameliyathanesi olmak ??zere d??rt ameliyathane mevcuttur.'
    ,
    '51-koroner-youn-bakm': '<br><br><br>4 Yatak Kapesiteli Koroner Yo??un Bak??m Servisi'
    ,
    '52-genel-cerrahi-youn-bakm': '<br><br><br>4 Yatak Kapesiteli Genel Cerrahi Yo??un Bak??m Servisi'
    ,
    '53-kardiovaskler-cerrahi-youn-bakm': '<br><br><br>4 Yatak Kapesiteli Kardiovask??ler Cerrahi Yo??un Bak??m Servisi'
    ,
    '54-eeg-emg-uyku-laboratuvar-odas': '<br><br><br>EMG,EEG,UYKU Laboratuvar Odas?? ;Epilepsi, kas ve sinir hastal??klar?? ve uyku bozukluklar??n??n te??hisin de kullan??lmak ??zere hizmet vermektedir.'
    ,
    '55-gnbirlik-hasta-tedavi-ve-takip-servisi': '<br><br><br>G??n??birlik hasta tedavi ve takip servisi; bu serviste 24 saate kadar varan s??relerle tedavi ve takip edilen hastalar??m??za hizmet verilmektedir.'
    ,
    '56-gnbirlik-hasta-tedavi-ve-takip-servisi-2': '<br><br><br>G??n??birlik hasta tedavi ve takip servisi; bu serviste 24 saate kadar varan s??relerle tedavi ve takip edilen hastalar??m??za hizmet verilmektedir.'
  };

  function infoEvent() {
    if(infoSection.style.display === 'none') {

      let currentScene = document.getElementsByClassName('scene current');
      let sceneDataId = currentScene[0].getAttribute('data-id');
      let dataIdIndex = sceneArray[sceneDataId];
      if (dataIdIndex) {
        infoSectionText.innerHTML = dataIdIndex;
      }
      else {
        infoSectionText.innerHTML = '??ZEL EDREM??T K??RFEZ HASTANES??';
      }

      infoSection.style.display = 'block';
    }
    else{
      infoSection.style.display = 'none';
    }
  }

  function closeInfo() {
    infoSection.style.display = 'none';
  }

  function startAutorotate() {
    // if (!autorotateToggleElement.classList.contains('enabled')) {
    //   return;
    // }
    viewer.startMovement(autorotate);
    viewer.setIdleMovement(3000, autorotate);
  }

  function stopAutorotate() {
    viewer.stopMovement();
    viewer.setIdleMovement(Infinity);
  }

  // function toggleAutorotate() {
  //   if (autorotateToggleElement.classList.contains('enabled')) {
  //     autorotateToggleElement.classList.remove('enabled');
  //     stopAutorotate();
  //   } else {
  //     autorotateToggleElement.classList.add('enabled');
  //     startAutorotate();
  //   }
  // }

  function createLinkHotspotElement(hotspot) {

    // Create wrapper element to hold icon and tooltip.
    var wrapper = document.createElement('div');
    wrapper.classList.add('hotspot');
    wrapper.classList.add('link-hotspot');

    // Create image element.
    var icon = document.createElement('img');
    icon.src = 'korfez-hastanesi-360-tur/img/link.png';
    icon.classList.add('link-hotspot-icon');

    // Set rotation transform.
    var transformProperties = [ '-ms-transform', '-webkit-transform', 'transform' ];
    for (var i = 0; i < transformProperties.length; i++) {
      var property = transformProperties[i];
      icon.style[property] = 'rotate(' + hotspot.rotation + 'rad)';
    }

    // Add click event handler.
    wrapper.addEventListener('click', function() {
      switchScene(findSceneById(hotspot.target));
    });

    // Prevent touch and scroll events from reaching the parent element.
    // This prevents the view control logic from interfering with the hotspot.
    stopTouchAndScrollEventPropagation(wrapper);

    // Create tooltip element.
    var tooltip = document.createElement('div');
    tooltip.classList.add('hotspot-tooltip');
    tooltip.classList.add('link-hotspot-tooltip');
    tooltip.innerHTML = findSceneDataById(hotspot.target).name;

    wrapper.appendChild(icon);
    wrapper.appendChild(tooltip);

    return wrapper;
  }

  function createInfoHotspotElement(hotspot) {

    // Create wrapper element to hold icon and tooltip.
    var wrapper = document.createElement('div');
    wrapper.classList.add('hotspot');
    wrapper.classList.add('info-hotspot');

    // Create hotspot/tooltip header.
    var header = document.createElement('div');
    header.classList.add('info-hotspot-header');

    // Create image element.
    var iconWrapper = document.createElement('div');
    iconWrapper.classList.add('info-hotspot-icon-wrapper');
    var icon = document.createElement('img');
    icon.src = 'korfez-hastanesi-360-tur/img/info.png';
    icon.classList.add('info-hotspot-icon');
    iconWrapper.appendChild(icon);

    // Create title element.
    var titleWrapper = document.createElement('div');
    titleWrapper.classList.add('info-hotspot-title-wrapper');
    var title = document.createElement('div');
    title.classList.add('info-hotspot-title');
    title.innerHTML = hotspot.title;
    titleWrapper.appendChild(title);

    // Create close element.
    var closeWrapper = document.createElement('div');
    closeWrapper.classList.add('info-hotspot-close-wrapper');
    var closeIcon = document.createElement('img');
    closeIcon.src = 'korfez-hastanesi-360-tur/img/close.png';
    closeIcon.classList.add('info-hotspot-close-icon');
    closeWrapper.appendChild(closeIcon);

    // Construct header element.
    header.appendChild(iconWrapper);
    header.appendChild(titleWrapper);
    header.appendChild(closeWrapper);

    // Create text element.
    var text = document.createElement('div');
    text.classList.add('info-hotspot-text');
    text.innerHTML = hotspot.text;

    // Place header and text into wrapper element.
    wrapper.appendChild(header);
    wrapper.appendChild(text);

    // Create a modal for the hotspot content to appear on mobile mode.
    var modal = document.createElement('div');
    modal.innerHTML = wrapper.innerHTML;
    modal.classList.add('info-hotspot-modal');
    document.body.appendChild(modal);

    var toggle = function() {
      wrapper.classList.toggle('visible');
      modal.classList.toggle('visible');
    };

    // Show content when hotspot is clicked.
    wrapper.querySelector('.info-hotspot-header').addEventListener('click', toggle);

    // Hide content when close icon is clicked.
    modal.querySelector('.info-hotspot-close-wrapper').addEventListener('click', toggle);

    // Prevent touch and scroll events from reaching the parent element.
    // This prevents the view control logic from interfering with the hotspot.
    stopTouchAndScrollEventPropagation(wrapper);

    return wrapper;
  }

  // Prevent touch and scroll events from reaching the parent element.
  function stopTouchAndScrollEventPropagation(element, eventList) {
    var eventList = [ 'touchstart', 'touchmove', 'touchend', 'touchcancel',
                      'wheel', 'mousewheel' ];
    for (var i = 0; i < eventList.length; i++) {
      element.addEventListener(eventList[i], function(event) {
        event.stopPropagation();
      });
    }
  }

  function findSceneById(id) {
    for (var i = 0; i < scenes.length; i++) {
      if (scenes[i].data.id === id) {
        return scenes[i];
      }
    }
    return null;
  }

  function findSceneDataById(id) {
    for (var i = 0; i < data.scenes.length; i++) {
      if (data.scenes[i].id === id) {
        return data.scenes[i];
      }
    }
    return null;
  }

  // Display the initial scene.
  switchScene(scenes[0]);

})();
