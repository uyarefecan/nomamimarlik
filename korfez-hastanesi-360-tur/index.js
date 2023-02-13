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
    '0-ana-giri': 'ÖZEL EDREMİT KÖRFEZ HASTANESİ HAKKINDA<br><br>' +
    '&emsp;Kuzey Ege Bölgesinde sağlık alanında tüm branşlarda (dahili ve cerrahi ) ' +
    'hissedilen eksiklikler nedeniyle planlanıp bölgenin gereksinimlerine uygun olarak 2010 ' +
    'yılında hizmet vermeye başlayan A sınıfı bir hastane olarak çevre il ve ilçelerde başta ' +
    'olmak üzere Balıkesir Edremit Körfez Bölgesinin en modern ve en kapsamlı sağlık kuruluşlarından biridir.<br><br>' +
    '&emsp;Yaklaşık 11 bin metrekare kapalı alana kurulu olan hastanemiz; 28’i yoğun bakım olmak üzere toplam 93 hasta yatağı, ' +
    'tam teşekküllü genel yoğun bakım, kardiyovasküler cerrahi yoğun bakım, koroner yoğun bakım, cerrahi yoğun bakım ve ' +
    'yenidoğan yoğun bakım servisleri ve modern ameliyathaneleri, doğumhaneleri, fizik tedavi ve rehabilitasyon servisi, ' +
    'diş ağız ve çene cerrahisi ünitesi, modern radyoloji görüntüleme merkezi, tıbbi biyokimya ve mikrobiyoloji laboratuvarları' +
    'ile hemen hemen tüm branşlarda SGK, anlaşmalı özel sigorta ve kurumlarla poliklinik, yatarak teşhis ve tedavi hizmeti sunmaktadır.<br><br>' +
    '&emsp;Hastanemizde tüm hasta ve misafirlerimizin kullanabileceği ücretsiz otoparklarımız hizmet vermektedir.<br><br>' +
    '&emsp;Otoparkımızda birçok bankaya ait bankamatik bulunmaktadır.<br><br>' +
    '&emsp;Hastanemiz Çanakkale-İzmir Karayoluüzerinde, Edremit’e 3.Km mesafededir.'
    ,
    '1-giri': 'ÖZEL EDREMİT KÖRFEZ HASTANESİ HAKKINDA<br><br>' +
    '&emsp;Kuzey Ege Bölgesinde sağlık alanında tüm branşlarda (dahili ve cerrahi ) ' +
    'hissedilen eksiklikler nedeniyle planlanıp bölgenin gereksinimlerine uygun olarak 2010 ' +
    'yılında hizmet vermeye başlayan A sınıfı bir hastane olarak çevre il ve ilçelerde başta ' +
    'olmak üzere Balıkesir Edremit Körfez Bölgesinin en modern ve en kapsamlı sağlık kuruluşlarından biridir.<br><br>' +
    '&emsp;Yaklaşık 11 bin metrekare kapalı alana kurulu olan hastanemiz; 28’i yoğun bakım olmak üzere toplam 93 hasta yatağı, ' +
    'tam teşekküllü genel yoğun bakım, kardiyovasküler cerrahi yoğun bakım, koroner yoğun bakım, cerrahi yoğun bakım ve ' +
    'yenidoğan yoğun bakım servisleri ve modern ameliyathaneleri, doğumhaneleri, fizik tedavi ve rehabilitasyon servisi, ' +
    'diş ağız ve çene cerrahisi ünitesi, modern radyoloji görüntüleme merkezi, tıbbi biyokimya ve mikrobiyoloji laboratuvarları' +
    'ile hemen hemen tüm branşlarda SGK, anlaşmalı özel sigorta ve kurumlarla poliklinik, yatarak teşhis ve tedavi hizmeti sunmaktadır.<br><br>' +
    '&emsp;Hastanemizde tüm hasta ve misafirlerimizin kullanabileceği ücretsiz otoparklarımız hizmet vermektedir.<br><br>' +
    '&emsp;Otoparkımızda birçok bankaya ait bankamatik bulunmaktadır.<br><br>' +
    '&emsp;Hastanemiz Çanakkale-İzmir Karayoluüzerinde, Edremit’e 3.Km mesafededir.'
    ,
    '2-danma': 'ÖZEL EDREMİT KÖRFEZ HASTANESİ HAKKINDA<br><br>' +
    '&emsp;Kuzey Ege Bölgesinde sağlık alanında tüm branşlarda (dahili ve cerrahi ) ' +
    'hissedilen eksiklikler nedeniyle planlanıp bölgenin gereksinimlerine uygun olarak 2010 ' +
    'yılında hizmet vermeye başlayan A sınıfı bir hastane olarak çevre il ve ilçelerde başta ' +
    'olmak üzere Balıkesir Edremit Körfez Bölgesinin en modern ve en kapsamlı sağlık kuruluşlarından biridir.<br><br>' +
    '&emsp;Yaklaşık 11 bin metrekare kapalı alana kurulu olan hastanemiz; 28’i yoğun bakım olmak üzere toplam 93 hasta yatağı, ' +
    'tam teşekküllü genel yoğun bakım, kardiyovasküler cerrahi yoğun bakım, koroner yoğun bakım, cerrahi yoğun bakım ve ' +
    'yenidoğan yoğun bakım servisleri ve modern ameliyathaneleri, doğumhaneleri, fizik tedavi ve rehabilitasyon servisi, ' +
    'diş ağız ve çene cerrahisi ünitesi, modern radyoloji görüntüleme merkezi, tıbbi biyokimya ve mikrobiyoloji laboratuvarları' +
    'ile hemen hemen tüm branşlarda SGK, anlaşmalı özel sigorta ve kurumlarla poliklinik, yatarak teşhis ve tedavi hizmeti sunmaktadır.<br><br>' +
    '&emsp;Hastanemizde tüm hasta ve misafirlerimizin kullanabileceği ücretsiz otoparklarımız hizmet vermektedir.<br><br>' +
    '&emsp;Otoparkımızda birçok bankaya ait bankamatik bulunmaktadır.<br><br>' +
    '&emsp;Hastanemiz Çanakkale-İzmir Karayoluüzerinde, Edremit’e 3.Km mesafededir.'
    ,
    '3-bekleme-alan': 'ÖZEL EDREMİT KÖRFEZ HASTANESİ HAKKINDA<br><br>' +
    '&emsp;Kuzey Ege Bölgesinde sağlık alanında tüm branşlarda (dahili ve cerrahi ) ' +
    'hissedilen eksiklikler nedeniyle planlanıp bölgenin gereksinimlerine uygun olarak 2010 ' +
    'yılında hizmet vermeye başlayan A sınıfı bir hastane olarak çevre il ve ilçelerde başta ' +
    'olmak üzere Balıkesir Edremit Körfez Bölgesinin en modern ve en kapsamlı sağlık kuruluşlarından biridir.<br><br>' +
    '&emsp;Yaklaşık 11 bin metrekare kapalı alana kurulu olan hastanemiz; 28’i yoğun bakım olmak üzere toplam 93 hasta yatağı, ' +
    'tam teşekküllü genel yoğun bakım, kardiyovasküler cerrahi yoğun bakım, koroner yoğun bakım, cerrahi yoğun bakım ve ' +
    'yenidoğan yoğun bakım servisleri ve modern ameliyathaneleri, doğumhaneleri, fizik tedavi ve rehabilitasyon servisi, ' +
    'diş ağız ve çene cerrahisi ünitesi, modern radyoloji görüntüleme merkezi, tıbbi biyokimya ve mikrobiyoloji laboratuvarları' +
    'ile hemen hemen tüm branşlarda SGK, anlaşmalı özel sigorta ve kurumlarla poliklinik, yatarak teşhis ve tedavi hizmeti sunmaktadır.<br><br>' +
    '&emsp;Hastanemizde tüm hasta ve misafirlerimizin kullanabileceği ücretsiz otoparklarımız hizmet vermektedir.<br><br>' +
    '&emsp;Otoparkımızda birçok bankaya ait bankamatik bulunmaktadır.<br><br>' +
    '&emsp;Hastanemiz Çanakkale-İzmir Karayoluüzerinde, Edremit’e 3.Km mesafededir.'
    ,
    '4-kafeterya': 'ÖZEL EDREMİT KÖRFEZ HASTANESİ HAKKINDA<br><br>' +
    '&emsp;Kuzey Ege Bölgesinde sağlık alanında tüm branşlarda (dahili ve cerrahi ) ' +
    'hissedilen eksiklikler nedeniyle planlanıp bölgenin gereksinimlerine uygun olarak 2010 ' +
    'yılında hizmet vermeye başlayan A sınıfı bir hastane olarak çevre il ve ilçelerde başta ' +
    'olmak üzere Balıkesir Edremit Körfez Bölgesinin en modern ve en kapsamlı sağlık kuruluşlarından biridir.<br><br>' +
    '&emsp;Yaklaşık 11 bin metrekare kapalı alana kurulu olan hastanemiz; 28’i yoğun bakım olmak üzere toplam 93 hasta yatağı, ' +
    'tam teşekküllü genel yoğun bakım, kardiyovasküler cerrahi yoğun bakım, koroner yoğun bakım, cerrahi yoğun bakım ve ' +
    'yenidoğan yoğun bakım servisleri ve modern ameliyathaneleri, doğumhaneleri, fizik tedavi ve rehabilitasyon servisi, ' +
    'diş ağız ve çene cerrahisi ünitesi, modern radyoloji görüntüleme merkezi, tıbbi biyokimya ve mikrobiyoloji laboratuvarları' +
    'ile hemen hemen tüm branşlarda SGK, anlaşmalı özel sigorta ve kurumlarla poliklinik, yatarak teşhis ve tedavi hizmeti sunmaktadır.<br><br>' +
    '&emsp;Hastanemizde tüm hasta ve misafirlerimizin kullanabileceği ücretsiz otoparklarımız hizmet vermektedir.<br><br>' +
    '&emsp;Otoparkımızda birçok bankaya ait bankamatik bulunmaktadır.<br><br>' +
    '&emsp;Hastanemiz Çanakkale-İzmir Karayoluüzerinde, Edremit’e 3.Km mesafededir.'
    ,
    '5-acil-girii': '<br><br><br>Acil Servisimiz her türlü sağlık ihtiyacına zamanında ve etkin cevap verebilmek amacıyla yeterli sayıda uzman doktor ve yardımcı '+
    'sağlık personeliyle 7 gün 24 saat hizmet vermektedir. 6 gözlem odası, 2 yataklı acil müdehale/girişim odası, triaj odası, 1 alçı '+
    'odası ile hizmet veren acil serviste 24 saat CT, MRI, Röntgen ve tıbbi laboratuar tahlilleri yapılmaktadır.'
    ,
    '6-rntgen': '<br><br><br>Radyoloji görüntüleme merkezinde; Röntgen, Renkli Doppler Ultrasonografi, Digital Mamografi, Digital Floroskopi, Kemik Dansitometresi, '+
    'Bilgisayarlı Tomografi(CT), 1,5 Tesla Manyetik Rezonans Görüntüleme(MRI) ileri teknolojik cihazlarla hastalıkların teşhisi için kullanılmakta ve '+
    'PACS teknolojisiyle tüm hekimlerimizin hizmetine sunulmaktadır.'
    ,
    '7-ultrasonografi': '<br><br><br>Radyoloji görüntüleme merkezinde; Röntgen, Renkli Doppler Ultrasonografi, Digital Mamografi, Digital Floroskopi, Kemik Dansitometresi, '+
    'Bilgisayarlı Tomografi(CT), 1,5 Tesla Manyetik Rezonans Görüntüleme(MRI) ileri teknolojik cihazlarla hastalıkların teşhisi için kullanılmakta ve '+
    'PACS teknolojisiyle tüm hekimlerimizin hizmetine sunulmaktadır.'
    ,
    '8-mamografi': '<br><br><br>Radyoloji görüntüleme merkezinde; Röntgen, Renkli Doppler Ultrasonografi, Digital Mamografi, Digital Floroskopi, Kemik Dansitometresi, '+
    'Bilgisayarlı Tomografi(CT), 1,5 Tesla Manyetik Rezonans Görüntüleme(MRI) ileri teknolojik cihazlarla hastalıkların teşhisi için kullanılmakta ve '+
    'PACS teknolojisiyle tüm hekimlerimizin hizmetine sunulmaktadır.'
    ,
    '9-floroskopi': '<br><br><br>Radyoloji görüntüleme merkezinde; Röntgen, Renkli Doppler Ultrasonografi, Digital Mamografi, Digital Floroskopi, Kemik Dansitometresi, '+
    'Bilgisayarlı Tomografi(CT), 1,5 Tesla Manyetik Rezonans Görüntüleme(MRI) ileri teknolojik cihazlarla hastalıkların teşhisi için kullanılmakta ve '+
    'PACS teknolojisiyle tüm hekimlerimizin hizmetine sunulmaktadır.'
    ,
    '10-kemik-densitometresi': '<br><br><br>Radyoloji görüntüleme merkezinde; Röntgen, Renkli Doppler Ultrasonografi, Digital Mamografi, Digital Floroskopi, Kemik Dansitometresi, '+
    'Bilgisayarlı Tomografi(CT), 1,5 Tesla Manyetik Rezonans Görüntüleme(MRI) ileri teknolojik cihazlarla hastalıkların teşhisi için kullanılmakta ve '+
    'PACS teknolojisiyle tüm hekimlerimizin hizmetine sunulmaktadır.'
    ,
    '11-bilgisayarl-tomografi-ct': '<br><br><br>Radyoloji görüntüleme merkezinde; Röntgen, Renkli Doppler Ultrasonografi, Digital Mamografi, Digital Floroskopi, Kemik Dansitometresi, '+
    'Bilgisayarlı Tomografi(CT), 1,5 Tesla Manyetik Rezonans Görüntüleme(MRI) ileri teknolojik cihazlarla hastalıkların teşhisi için kullanılmakta ve '+
    'PACS teknolojisiyle tüm hekimlerimizin hizmetine sunulmaktadır.'
    ,
    '12-manyetin-rezonans-grntleme-mri': '<br><br><br>Radyoloji görüntüleme merkezinde; Röntgen, Renkli Doppler Ultrasonografi, Digital Mamografi, Digital Floroskopi, Kemik Dansitometresi, '+
    'Bilgisayarlı Tomografi(CT), 1,5 Tesla Manyetik Rezonans Görüntüleme(MRI) ileri teknolojik cihazlarla hastalıkların teşhisi için kullanılmakta ve '+
    'PACS teknolojisiyle tüm hekimlerimizin hizmetine sunulmaktadır.'
    ,
    '13-bokmya-ve-mkrobyoloj-laboratuvari': '<br><br><br>En ileri teknolojik cihazlar kullanılarak hastalardan alınan her türlü numunelerle hastalık teşhişlerine yönelik tetkikler en kısa '+
    'sürede uluslararası kalite güvencesi kuralları uygulanarak neticelendirilmektedir.'
    ,
    '14-bokmya-ve-mkrobyoloj-laboratuvari-2': '<br><br><br>En ileri teknolojik cihazlar kullanılarak hastalardan alınan her türlü numunelerle hastalık teşhişlerine yönelik tetkikler en kısa '+
    'sürede uluslararası kalite güvencesi kuralları uygulanarak neticelendirilmektedir.'
    ,
    '15-eswl-bbrek-tai-kirma-ntes': '<br><br><br>Kuzey Ege Bölgesinde büyük bir eksikliğin giderilmesi amacıyla kurulmuş ve Uzman Hekimlerimiz tarafından uygulaması yapılarak hizmete sunulmuştur. '
    ,
    '16-di-poliklinii': '<br><br><br>Bu ünitemizde 2 diş hekimi çene ve ağız cerrahi uzmanı ile Panoramik röntgen, Panoramik bilgisayarlı Tomografi ve diğer modern diş ekipmanlarıyla, ağız çene cerrahisi, '+
    'tüm diş tedavileri, diş implantları ve protezleri yapılmaktadır.'
    ,
    '17-az-ve-ene-cerrahisi-poliklinii': '<br><br><br>Bu ünitemizde 2 diş hekimi çene ve ağız cerrahi uzmanı ile Panoramik röntgen, Panoramik bilgisayarlı Tomografi ve diğer modern diş ekipmanlarıyla, ağız çene cerrahisi, '+
    'tüm diş tedavileri, diş implantları ve protezleri yapılmaktadır.'
    ,
    '18-panaromik-tomografi': '<br><br><br>Bu ünitemizde 2 diş hekimi çene ve ağız cerrahi uzmanı ile Panoramik röntgen, Panoramik bilgisayarlı Tomografi ve diğer modern diş ekipmanlarıyla, ağız çene cerrahisi, '+
    'tüm diş tedavileri, diş implantları ve protezleri yapılmaktadır.'
    ,
    '25-kadn-doum-ve-hastalklar-poliklinii': '<br><br><br>Kadın Doğum ve Hastalıkları Polikliniği ( Dört boyutlu  General Elektrik Volusen E80 Renkli Doppler USG ile  gelişmiş uygulama ve üstün görüntü kalitesiyle '+
    'tüm hamilelik süreci boyunca takibi sağlar, günlük rutin işlemlerden karmaşık işlemlere kadar oluşabilecek problemlere mümkün olduğunca erken müdahale edebilmek için teşhis ve erken tedaviye olanak '+
    'sunan dünyadaki en ileri teknolojiyi kullanmaktadır).'
    ,
    '26-kadn-doum-ve-hastalklar-poliklinii-2': '<br><br><br>Kadın Doğum ve Hastalıkları Polikliniği ( Dört boyutlu  General Elektrik Volusen E80 Renkli Doppler USG ile  gelişmiş uygulama ve üstün görüntü kalitesiyle '+
    'tüm hamilelik süreci boyunca takibi sağlar, günlük rutin işlemlerden karmaşık işlemlere kadar oluşabilecek problemlere mümkün olduğunca erken müdahale edebilmek için teşhis ve erken tedaviye olanak '+
    'sunan dünyadaki en ileri teknolojiyi kullanmaktadır).'
    ,
    '27-gz-poliklinii': '<br><br><br>Göz poliklinik odaları (Göz hastalıklarının teşhis ve tedavisi amacıyla anjiografi, bilgisayarlı göz tomografisi (Optik Koherans Tomografi) dahil olmak üzere ileri teknolojik cihazlarla '+
    'donatılmış olup 3 uzman hekimimiz tarafından hizmet verilmekte ve her türlü göz hastalıklarına yönelik operasyonlar hastanemizde gerçekleştirilmektedir). Optik Koherans Tomografi düşük enerjili laser ışınları '+
    'kullanılarak göze dokunmadan ve radyasyona maruz bırakılmadan zarar vermeden yapılan gözün retina tabakası ve görme sinirinin taranmasıyla retina, sarı nokta, glokom gibi birçok hastalığın teşhis ve takibinde '+
    'kullanılan güvenilir bir tetkiktir.'
    ,
    '28-gz-poliklinii-2': '<br><br><br>Göz poliklinik odaları (Göz hastalıklarının teşhis ve tedavisi amacıyla anjiografi, bilgisayarlı göz tomografisi (Optik Koherans Tomografi) dahil olmak üzere ileri teknolojik cihazlarla '+
    'donatılmış olup 3 uzman hekimimiz tarafından hizmet verilmekte ve her türlü göz hastalıklarına yönelik operasyonlar hastanemizde gerçekleştirilmektedir). Optik Koherans Tomografi düşük enerjili laser ışınları '+
    'kullanılarak göze dokunmadan ve radyasyona maruz bırakılmadan zarar vermeden yapılan gözün retina tabakası ve görme sinirinin taranmasıyla retina, sarı nokta, glokom gibi birçok hastalığın teşhis ve takibinde '+
    'kullanılan güvenilir bir tetkiktir.'
    ,
    '29-gz-poliklinii-3': '<br><br><br>Göz poliklinik odaları (Göz hastalıklarının teşhis ve tedavisi amacıyla anjiografi, bilgisayarlı göz tomografisi (Optik Koherans Tomografi) dahil olmak üzere ileri teknolojik cihazlarla '+
    'donatılmış olup 3 uzman hekimimiz tarafından hizmet verilmekte ve her türlü göz hastalıklarına yönelik operasyonlar hastanemizde gerçekleştirilmektedir). Optik Koherans Tomografi düşük enerjili laser ışınları '+
    'kullanılarak göze dokunmadan ve radyasyona maruz bırakılmadan zarar vermeden yapılan gözün retina tabakası ve görme sinirinin taranmasıyla retina, sarı nokta, glokom gibi birçok hastalığın teşhis ve takibinde '+
    'kullanılan güvenilir bir tetkiktir.'
    ,
    '30-gz-poliklinii-4': '<br><br><br>Göz poliklinik odaları (Göz hastalıklarının teşhis ve tedavisi amacıyla anjiografi, bilgisayarlı göz tomografisi (Optik Koherans Tomografi) dahil olmak üzere ileri teknolojik cihazlarla '+
    'donatılmış olup 3 uzman hekimimiz tarafından hizmet verilmekte ve her türlü göz hastalıklarına yönelik operasyonlar hastanemizde gerçekleştirilmektedir). Optik Koherans Tomografi düşük enerjili laser ışınları '+
    'kullanılarak göze dokunmadan ve radyasyona maruz bırakılmadan zarar vermeden yapılan gözün retina tabakası ve görme sinirinin taranmasıyla retina, sarı nokta, glokom gibi birçok hastalığın teşhis ve takibinde '+
    'kullanılan güvenilir bir tetkiktir.'
    ,
    '32-doumhane': '<br><br><br>Hastanemizde 2 modern doğum odası mevcuttur.'
    ,
    '43-fizik-tedavi-ve-rehabilitasyon': '<br><br><br>Fizik Tedavi ve Rehabilitasyon Servisi; En iyi koşullarda hizmet vermek amacıyla ileri teknolojik cihazlarla donatılarak hastaların günlük yaşam aktivitelerini geri '+
    'kazanmaları, çalışma ve sosyal yaşamlarına etkin bir şekilde devam edebilmeleri için hastaya özel yaklaşımlarla, randevu sistemi uygulanarak, omurilik yaralanmaları, inme (beden felci), kafa ya da diğer '+
    'vücut travmaları sonrası oluşan yaralanmalar, spor yaralanmaları, romatolojik hastalıklar, multiple sklerozis dahil olmak üzere diğer nörolojik kas ve sinir sistemi hastalıkları, operasyon öncesi ve sonrası '+
    'ortopedik rehabilitasyonlar uzman hekimlerimiz ve fizyoterapistlerimiz tarafından tedavi edilmektedirler.'
    ,
    '44-fizik-tedavi-ve-rehabilitasyon-2': '<br><br><br>Fizik Tedavi ve Rehabilitasyon Servisi; En iyi koşullarda hizmet vermek amacıyla ileri teknolojik cihazlarla donatılarak hastaların günlük yaşam aktivitelerini geri '+
    'kazanmaları, çalışma ve sosyal yaşamlarına etkin bir şekilde devam edebilmeleri için hastaya özel yaklaşımlarla, randevu sistemi uygulanarak, omurilik yaralanmaları, inme (beden felci), kafa ya da diğer '+
    'vücut travmaları sonrası oluşan yaralanmalar, spor yaralanmaları, romatolojik hastalıklar, multiple sklerozis dahil olmak üzere diğer nörolojik kas ve sinir sistemi hastalıkları, operasyon öncesi ve sonrası '+
    'ortopedik rehabilitasyonlar uzman hekimlerimiz ve fizyoterapistlerimiz tarafından tedavi edilmektedirler.'
    ,
    '45-fizik-tedavi-ve-rehabilitasyon-3': '<br><br><br>Fizik Tedavi ve Rehabilitasyon Servisi; En iyi koşullarda hizmet vermek amacıyla ileri teknolojik cihazlarla donatılarak hastaların günlük yaşam aktivitelerini geri '+
    'kazanmaları, çalışma ve sosyal yaşamlarına etkin bir şekilde devam edebilmeleri için hastaya özel yaklaşımlarla, randevu sistemi uygulanarak, omurilik yaralanmaları, inme (beden felci), kafa ya da diğer '+
    'vücut travmaları sonrası oluşan yaralanmalar, spor yaralanmaları, romatolojik hastalıklar, multiple sklerozis dahil olmak üzere diğer nörolojik kas ve sinir sistemi hastalıkları, operasyon öncesi ve sonrası '+
    'ortopedik rehabilitasyonlar uzman hekimlerimiz ve fizyoterapistlerimiz tarafından tedavi edilmektedirler.'
    ,
    '46-fizik-tedavi-ve-rehabilitasyon-odas': '<br><br><br>Fizik Tedavi ve Rehabilitasyon Servisi; En iyi koşullarda hizmet vermek amacıyla ileri teknolojik cihazlarla donatılarak hastaların günlük yaşam aktivitelerini geri '+
    'kazanmaları, çalışma ve sosyal yaşamlarına etkin bir şekilde devam edebilmeleri için hastaya özel yaklaşımlarla, randevu sistemi uygulanarak, omurilik yaralanmaları, inme (beden felci), kafa ya da diğer '+
    'vücut travmaları sonrası oluşan yaralanmalar, spor yaralanmaları, romatolojik hastalıklar, multiple sklerozis dahil olmak üzere diğer nörolojik kas ve sinir sistemi hastalıkları, operasyon öncesi ve sonrası '+
    'ortopedik rehabilitasyonlar uzman hekimlerimiz ve fizyoterapistlerimiz tarafından tedavi edilmektedirler.'
    ,
    '49-kardiovaskler-cerrahi-ameliyathanesi': '<br><br><br>Birisi Kardiovasküler Cerrahi Ameliyathanesi olmak üzere dört ameliyathane mevcuttur.'
    ,
    '51-koroner-youn-bakm': '<br><br><br>4 Yatak Kapesiteli Koroner Yoğun Bakım Servisi'
    ,
    '52-genel-cerrahi-youn-bakm': '<br><br><br>4 Yatak Kapesiteli Genel Cerrahi Yoğun Bakım Servisi'
    ,
    '53-kardiovaskler-cerrahi-youn-bakm': '<br><br><br>4 Yatak Kapesiteli Kardiovasküler Cerrahi Yoğun Bakım Servisi'
    ,
    '54-eeg-emg-uyku-laboratuvar-odas': '<br><br><br>EMG,EEG,UYKU Laboratuvar Odası ;Epilepsi, kas ve sinir hastalıkları ve uyku bozukluklarının teşhisin de kullanılmak üzere hizmet vermektedir.'
    ,
    '55-gnbirlik-hasta-tedavi-ve-takip-servisi': '<br><br><br>Günübirlik hasta tedavi ve takip servisi; bu serviste 24 saate kadar varan sürelerle tedavi ve takip edilen hastalarımıza hizmet verilmektedir.'
    ,
    '56-gnbirlik-hasta-tedavi-ve-takip-servisi-2': '<br><br><br>Günübirlik hasta tedavi ve takip servisi; bu serviste 24 saate kadar varan sürelerle tedavi ve takip edilen hastalarımıza hizmet verilmektedir.'
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
        infoSectionText.innerHTML = 'ÖZEL EDREMİT KÖRFEZ HASTANESİ';
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
