var APP_DATA = {
  "scenes": [
    {
      "id": "0-riva-evleri-vaziyet",
      "name": "Ege Riva Konakları Vaziyet",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        }
      ],
      "faceSize": 1024,
      "initialViewParameters": {
        "yaw": 0.7134814279494286,
        "pitch": 0.7924563711039916,
        "fov": 1.3729094996294073
      },
      "linkHotspots": [
        {
          "yaw": 1.3452636029111744,
          "pitch": 0.8330986269664233,
          "rotation": 0,
          "target": "1-a-etap-giris"
        },
        {
          "yaw": -2.726146917587842,
          "pitch": 0.9085328323372046,
          "rotation": 0,
          "target": "6-b-etap-giris"
        }
      ],
      "infoHotspots": []
    },
    {
      "id": "1-a-etap-giris",
      "name": "A Etap Giris",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        }
      ],
      "faceSize": 1024,
      "initialViewParameters": {
        "yaw": 0.08189659258242088,
        "pitch": 0.4222905913494337,
        "fov": 1.3729094996294073
      },
      "linkHotspots": [
        {
          "yaw": -0.048763984154520656,
          "pitch": 0.7834177659852415,
          "rotation": 6.283185307179586,
          "target": "2-a-etap-ortak-alan"
        },
        {
          "yaw": 2.3076281124122042,
          "pitch": -0.11513896792952139,
          "rotation": 0,
          "target": "0-riva-evleri-vaziyet"
        },
        {
          "yaw": -2.5308270679668645,
          "pitch": 0.4601196327750223,
          "rotation": 0,
          "target": "6-b-etap-giris"
        }
      ],
      "infoHotspots": []
    },
    {
      "id": "2-a-etap-ortak-alan",
      "name": "A Etap Ortak Alan",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        }
      ],
      "faceSize": 1024,
      "initialViewParameters": {
        "yaw": 0.13291353534418704,
        "pitch": 0.20091358531162484,
        "fov": 1.3729094996294073
      },
      "linkHotspots": [
        {
          "yaw": 0.21316799595629377,
          "pitch": 0.3035483847857563,
          "rotation": 0,
          "target": "3-a-etap-havuz"
        },
        {
          "yaw": -2.7305858658416096,
          "pitch": 0.33050284363727833,
          "rotation": 0,
          "target": "1-a-etap-giris"
        }
      ],
      "infoHotspots": []
    },
    {
      "id": "3-a-etap-havuz",
      "name": "A Etap Havuz",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        }
      ],
      "faceSize": 1024,
      "initialViewParameters": {
        "yaw": -1.0777851750870315,
        "pitch": 0.27900815130889,
        "fov": 1.3729094996294073
      },
      "linkHotspots": [
        {
          "yaw": -0.9511584261742492,
          "pitch": 0.1540794062028752,
          "rotation": 0,
          "target": "4-a-etap-ortak-alan-2"
        },
        {
          "yaw": 2.2641878307921095,
          "pitch": 0.1658161328897947,
          "rotation": 0,
          "target": "2-a-etap-ortak-alan"
        }
      ],
      "infoHotspots": []
    },
    {
      "id": "4-a-etap-ortak-alan-2",
      "name": "A Etap Ortak Alan 2",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        }
      ],
      "faceSize": 1024,
      "initialViewParameters": {
        "yaw": 0.030879871243289614,
        "pitch": 0.5041379012872973,
        "fov": 1.3729094996294073
      },
      "linkHotspots": [
        {
          "yaw": -2.4996295338767176,
          "pitch": -0.0714453100675243,
          "rotation": 0,
          "target": "5-a-etap-vaziyet"
        },
        {
          "yaw": 0.09907552791483099,
          "pitch": 0.5754636470202623,
          "rotation": 0,
          "target": "3-a-etap-havuz"
        }
      ],
      "infoHotspots": []
    },
    {
      "id": "5-a-etap-vaziyet",
      "name": "A Etap Vaziyet",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        }
      ],
      "faceSize": 1024,
      "initialViewParameters": {
        "yaw": -0.0490704504345949,
        "pitch": 0.38815466111190844,
        "fov": 1.3729094996294073
      },
      "linkHotspots": [
        {
          "yaw": -0.13837238080287406,
          "pitch": 0.531741531651857,
          "rotation": 0,
          "target": "4-a-etap-ortak-alan-2"
        }
      ],
      "infoHotspots": []
    },
    {
      "id": "6-b-etap-giris",
      "name": "B Etap Giris",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        }
      ],
      "faceSize": 1024,
      "initialViewParameters": {
        "yaw": -0.12240580361771869,
        "pitch": 0.3216592824807005,
        "fov": 1.3729094996294073
      },
      "linkHotspots": [
        {
          "yaw": -0.024897376389233727,
          "pitch": 0.621791018439005,
          "rotation": 0,
          "target": "7-b-etap-ortak-alan"
        },
        {
          "yaw": -2.2149019911757577,
          "pitch": 0.0469536575691869,
          "rotation": 0,
          "target": "0-riva-evleri-vaziyet"
        },
        {
          "yaw": 3.1005186401978975,
          "pitch": 0.47429868418024057,
          "rotation": 5.497787143782138,
          "target": "1-a-etap-giris"
        }
      ],
      "infoHotspots": []
    },
    {
      "id": "7-b-etap-ortak-alan",
      "name": "B Etap Ortak Alan",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        }
      ],
      "faceSize": 1024,
      "initialViewParameters": {
        "yaw": 0.05638756044904447,
        "pitch": 0.5022839632790621,
        "fov": 1.3729094996294073
      },
      "linkHotspots": [
        {
          "yaw": 0.4356125332714331,
          "pitch": 0.6184587753180537,
          "rotation": 0,
          "target": "8-b-etap-havuz"
        },
        {
          "yaw": 2.968580233978379,
          "pitch": 0.3056512175855417,
          "rotation": 0,
          "target": "6-b-etap-giris"
        }
      ],
      "infoHotspots": []
    },
    {
      "id": "8-b-etap-havuz",
      "name": "B Etap Havuz",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        }
      ],
      "faceSize": 1024,
      "initialViewParameters": {
        "yaw": -1.4155405778208277,
        "pitch": 0.2676562037380261,
        "fov": 1.3729094996294073
      },
      "linkHotspots": [
        {
          "yaw": 3.12626616706355,
          "pitch": 0.13787843772134067,
          "rotation": 0,
          "target": "9-b-etap-ortak-alan-2"
        },
        {
          "yaw": -1.258460945141337,
          "pitch": 0.19510407570882826,
          "rotation": 5.497787143782138,
          "target": "7-b-etap-ortak-alan"
        }
      ],
      "infoHotspots": []
    },
    {
      "id": "9-b-etap-ortak-alan-2",
      "name": "B Etap Ortak Alan 2",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        }
      ],
      "faceSize": 1024,
      "initialViewParameters": {
        "yaw": 0.04872265509391838,
        "pitch": 0.5717659383929821,
        "fov": 1.3729094996294073
      },
      "linkHotspots": [
        {
          "yaw": 2.591588711340507,
          "pitch": 0.28545270661001787,
          "rotation": 0,
          "target": "10-b-etap-vaziyet"
        },
        {
          "yaw": 0.04872265509391838,
          "pitch": 0.5717659383929821,
          "rotation": 0,
          "target": "8-b-etap-havuz"
        }
      ],
      "infoHotspots": []
    },
    {
      "id": "10-b-etap-vaziyet",
      "name": "B Etap Vaziyet",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        }
      ],
      "faceSize": 1024,
      "initialViewParameters": {
        "yaw": -0.032280287829031806,
        "pitch": 0.4762396096275552,
        "fov": 1.3729094996294073
      },
      "linkHotspots": [
        {
          "yaw": -0.006352683741456033,
          "pitch": 0.728179004118914,
          "rotation": 0,
          "target": "9-b-etap-ortak-alan-2"
        }
      ],
      "infoHotspots": []
    }
  ],
  "name": "Riva Konakları Vaziyet Turu",
  "settings": {
    "mouseViewMode": "drag",
    "autorotateEnabled": true,
    "fullscreenButton": false,
    "viewControlButtons": false
  }
};
