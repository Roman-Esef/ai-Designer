/* =========================================================================
   Деревья продуктов сделок ДИД (window.MOCK_DEAL_TREES), ключ — id сделки.
   Структура по ТЗ: productsDid[] → products[] → instruments[] → tranches[]
   (транши — не у всех инструментов). Нужно только будущей странице сделки;
   таблица портфеля этот файл не грузит. Плоские производные поля записи в
   mock-deals.js вычислены из этого дерева при генерации.
   ========================================================================= */

window.MOCK_DEAL_TREES = {
  "1024": {
    "id": 1024,
    "productsDid": [
      {
        "name": "Акционерный мезонин",
        "isMain": true,
        "products": [
          {
            "name": "Кредитная линия",
            "instruments": [
              {
                "name": "Кредитная линия №1",
                "currency": "RUB",
                "balance": "ООО «СБИ»",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "RUB"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1025": {
    "id": 1025,
    "productsDid": [
      {
        "name": "Кредитный мезонин",
        "isMain": true,
        "products": [
          {
            "name": "Опцион",
            "instruments": [
              {
                "name": "Опцион №1",
                "currency": "USD",
                "balance": "SBERFIN",
                "isPE": true,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "USD"
                  }
                ]
              }
            ]
          },
          {
            "name": "Привилегированные акции",
            "instruments": [
              {
                "name": "Привилегированные акции №1",
                "currency": "EUR",
                "balance": "ЮГ ИНВЕСТ",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "EUR"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "EUR"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Корпоративный контроль",
        "isMain": false,
        "products": [
          {
            "name": "Акции",
            "instruments": [
              {
                "name": "Акции №1",
                "currency": "USD",
                "balance": "SBERFIN",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "USD"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "USD"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1026": {
    "id": 1026,
    "productsDid": [
      {
        "name": "Корпоративный контроль",
        "isMain": true,
        "products": [
          {
            "name": "Акции",
            "instruments": [
              {
                "name": "Акции №1",
                "currency": "EUR",
                "balance": "СОКОЛ ФИНАНС",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "EUR"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Долевое участие в капитале",
        "isMain": false,
        "products": [
          {
            "name": "Обыкновенные акции",
            "instruments": [
              {
                "name": "Обыкновенные акции №1",
                "currency": "JPY",
                "balance": "ТрансКапитал",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "JPY"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "JPY"
                  }
                ]
              }
            ]
          },
          {
            "name": "Конвертируемый заём",
            "instruments": [
              {
                "name": "Конвертируемый заём №1",
                "currency": "EUR",
                "balance": "СОКОЛ ФИНАНС",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "EUR"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Венчурное финансирование",
        "isMain": false,
        "products": [
          {
            "name": "Привилегированные акции",
            "instruments": [
              {
                "name": "Привилегированные акции №1",
                "currency": "JPY",
                "balance": "ТрансКапитал",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "JPY"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1027": {
    "id": 1027,
    "productsDid": [
      {
        "name": "Долевое участие в капитале",
        "isMain": true,
        "products": [
          {
            "name": "Обыкновенные акции",
            "instruments": [
              {
                "name": "Обыкновенные акции №1",
                "currency": "JPY",
                "balance": "VPE CAPITAL",
                "isPE": false,
                "tranches": []
              }
            ]
          },
          {
            "name": "Конвертируемый заём",
            "instruments": [
              {
                "name": "Конвертируемый заём №1",
                "currency": "RUB",
                "balance": "ПромФинанс",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "RUB"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "RUB"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1028": {
    "id": 1028,
    "productsDid": [
      {
        "name": "Венчурное финансирование",
        "isMain": true,
        "products": [
          {
            "name": "Привилегированные акции",
            "instruments": [
              {
                "name": "Привилегированные акции №1",
                "currency": "RUB",
                "balance": "ЮГ ИНВЕСТ",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "RUB"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Акционерный мезонин",
        "isMain": false,
        "products": [
          {
            "name": "Заём",
            "instruments": [
              {
                "name": "Заём №1",
                "currency": "USD",
                "balance": "АгроБаланс",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "USD"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "USD"
                  }
                ]
              }
            ]
          },
          {
            "name": "Гарантия",
            "instruments": [
              {
                "name": "Гарантия №1",
                "currency": "RUB",
                "balance": "ЮГ ИНВЕСТ",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "RUB"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1029": {
    "id": 1029,
    "productsDid": [
      {
        "name": "Акционерный мезонин",
        "isMain": true,
        "products": [
          {
            "name": "Кредитная линия",
            "instruments": [
              {
                "name": "Кредитная линия №1",
                "currency": "RUB",
                "balance": "ООО «СБИ»",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "RUB"
                  }
                ]
              },
              {
                "name": "Кредитная линия №2",
                "currency": "USD",
                "balance": "SBERFIN",
                "isPE": false,
                "tranches": []
              },
              {
                "name": "Кредитная линия №3",
                "currency": "EUR",
                "balance": "СОКОЛ ФИНАНС",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "EUR"
                  }
                ]
              },
              {
                "name": "Кредитная линия №4",
                "currency": "JPY",
                "balance": "VPE CAPITAL",
                "isPE": false,
                "tranches": []
              }
            ]
          }
        ]
      }
    ]
  },
  "1030": {
    "id": 1030,
    "productsDid": [
      {
        "name": "Кредитный мезонин",
        "isMain": true,
        "products": [
          {
            "name": "Конвертируемый заём",
            "instruments": [
              {
                "name": "Конвертируемый заём №1",
                "currency": "EUR",
                "balance": "ПромФинанс",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "EUR"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1031": {
    "id": 1031,
    "productsDid": [
      {
        "name": "Корпоративный контроль",
        "isMain": true,
        "products": [
          {
            "name": "Доли в уставном капитале",
            "instruments": [
              {
                "name": "Доли в уставном капитале №1",
                "currency": "JPY",
                "balance": "АгроБаланс",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "JPY"
                  }
                ]
              }
            ]
          },
          {
            "name": "Кредитная линия",
            "instruments": [
              {
                "name": "Кредитная линия №1",
                "currency": "RUB",
                "balance": "СОКОЛ ФИНАНС",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "RUB"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "RUB"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Долевое участие в капитале",
        "isMain": false,
        "products": [
          {
            "name": "Гарантия",
            "instruments": [
              {
                "name": "Гарантия №1",
                "currency": "JPY",
                "balance": "АгроБаланс",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "JPY"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "JPY"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1032": {
    "id": 1032,
    "productsDid": [
      {
        "name": "Долевое участие в капитале",
        "isMain": true,
        "products": [
          {
            "name": "Гарантия",
            "instruments": [
              {
                "name": "Гарантия №1",
                "currency": "RUB",
                "balance": "ООО «СБИ»",
                "isPE": true,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "RUB"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Венчурное финансирование",
        "isMain": false,
        "products": [
          {
            "name": "Овердрафт",
            "instruments": [
              {
                "name": "Овердрафт №1",
                "currency": "USD",
                "balance": "VPE CAPITAL",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "USD"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "USD"
                  }
                ]
              }
            ]
          },
          {
            "name": "Акции",
            "instruments": [
              {
                "name": "Акции №1",
                "currency": "RUB",
                "balance": "ООО «СБИ»",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "RUB"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Акционерный мезонин",
        "isMain": false,
        "products": [
          {
            "name": "Кредитная линия",
            "instruments": [
              {
                "name": "Кредитная линия №1",
                "currency": "USD",
                "balance": "VPE CAPITAL",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "USD"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1033": {
    "id": 1033,
    "productsDid": [
      {
        "name": "Венчурное финансирование",
        "isMain": true,
        "products": [
          {
            "name": "Овердрафт",
            "instruments": [
              {
                "name": "Овердрафт №1",
                "currency": "USD",
                "balance": "SBERFIN",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "USD"
                  }
                ]
              }
            ]
          },
          {
            "name": "Акции",
            "instruments": [
              {
                "name": "Акции №1",
                "currency": "EUR",
                "balance": "ЮГ ИНВЕСТ",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "EUR"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "EUR"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1034": {
    "id": 1034,
    "productsDid": [
      {
        "name": "Акционерный мезонин",
        "isMain": true,
        "products": [
          {
            "name": "Кредитная линия",
            "instruments": [
              {
                "name": "Кредитная линия №1",
                "currency": "EUR",
                "balance": "СОКОЛ ФИНАНС",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "EUR"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Кредитный мезонин",
        "isMain": false,
        "products": [
          {
            "name": "Опцион",
            "instruments": [
              {
                "name": "Опцион №1",
                "currency": "JPY",
                "balance": "ТрансКапитал",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "JPY"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "JPY"
                  }
                ]
              }
            ]
          },
          {
            "name": "Привилегированные акции",
            "instruments": [
              {
                "name": "Привилегированные акции №1",
                "currency": "EUR",
                "balance": "СОКОЛ ФИНАНС",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "EUR"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1035": {
    "id": 1035,
    "productsDid": [
      {
        "name": "Кредитный мезонин",
        "isMain": true,
        "products": [
          {
            "name": "Опцион",
            "instruments": [
              {
                "name": "Опцион №1",
                "currency": "JPY",
                "balance": "VPE CAPITAL",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "JPY"
                  }
                ]
              }
            ]
          },
          {
            "name": "Привилегированные акции",
            "instruments": [
              {
                "name": "Привилегированные акции №1",
                "currency": "RUB",
                "balance": "ПромФинанс",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "RUB"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "RUB"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Корпоративный контроль",
        "isMain": false,
        "products": [
          {
            "name": "Акции",
            "instruments": [
              {
                "name": "Акции №1",
                "currency": "JPY",
                "balance": "VPE CAPITAL",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "JPY"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "JPY"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Долевое участие в капитале",
        "isMain": false,
        "products": [
          {
            "name": "Обыкновенные акции",
            "instruments": [
              {
                "name": "Обыкновенные акции №1",
                "currency": "RUB",
                "balance": "ПромФинанс",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "RUB"
                  }
                ]
              }
            ]
          },
          {
            "name": "Конвертируемый заём",
            "instruments": [
              {
                "name": "Конвертируемый заём №1",
                "currency": "JPY",
                "balance": "VPE CAPITAL",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "JPY"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "JPY"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1036": {
    "id": 1036,
    "productsDid": [
      {
        "name": "Корпоративный контроль",
        "isMain": true,
        "products": [
          {
            "name": "Опцион",
            "instruments": [
              {
                "name": "Опцион №1",
                "currency": "RUB",
                "balance": "ООО «СБИ»",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "RUB"
                  }
                ]
              },
              {
                "name": "Опцион №2",
                "currency": "USD",
                "balance": "SBERFIN",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "USD"
                  }
                ]
              },
              {
                "name": "Опцион №3",
                "currency": "EUR",
                "balance": "СОКОЛ ФИНАНС",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "EUR"
                  }
                ]
              },
              {
                "name": "Опцион №4",
                "currency": "JPY",
                "balance": "VPE CAPITAL",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "JPY"
                  }
                ]
              },
              {
                "name": "Опцион №5",
                "currency": "RUB",
                "balance": "ЮГ ИНВЕСТ",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "RUB"
                  }
                ]
              },
              {
                "name": "Опцион №6",
                "currency": "USD",
                "balance": "ТрансКапитал",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "USD"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1037": {
    "id": 1037,
    "productsDid": [
      {
        "name": "Долевое участие в капитале",
        "isMain": true,
        "products": [
          {
            "name": "Обыкновенные акции",
            "instruments": [
              {
                "name": "Обыкновенные акции №1",
                "currency": "USD",
                "balance": "ТрансКапитал",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "USD"
                  }
                ]
              }
            ]
          },
          {
            "name": "Конвертируемый заём",
            "instruments": [
              {
                "name": "Конвертируемый заём №1",
                "currency": "EUR",
                "balance": "ООО «СБИ»",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "EUR"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "EUR"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Венчурное финансирование",
        "isMain": false,
        "products": [
          {
            "name": "Привилегированные акции",
            "instruments": [
              {
                "name": "Привилегированные акции №1",
                "currency": "USD",
                "balance": "ТрансКапитал",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "USD"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "USD"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1038": {
    "id": 1038,
    "productsDid": [
      {
        "name": "Венчурное финансирование",
        "isMain": true,
        "products": [
          {
            "name": "Привилегированные акции",
            "instruments": [
              {
                "name": "Привилегированные акции №1",
                "currency": "EUR",
                "balance": "ПромФинанс",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "EUR"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Акционерный мезонин",
        "isMain": false,
        "products": [
          {
            "name": "Заём",
            "instruments": [
              {
                "name": "Заём №1",
                "currency": "JPY",
                "balance": "SBERFIN",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "JPY"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "JPY"
                  }
                ]
              }
            ]
          },
          {
            "name": "Гарантия",
            "instruments": [
              {
                "name": "Гарантия №1",
                "currency": "EUR",
                "balance": "ПромФинанс",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "EUR"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Кредитный мезонин",
        "isMain": false,
        "products": [
          {
            "name": "Конвертируемый заём",
            "instruments": [
              {
                "name": "Конвертируемый заём №1",
                "currency": "JPY",
                "balance": "SBERFIN",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "JPY"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1039": {
    "id": 1039,
    "productsDid": [
      {
        "name": "Акционерный мезонин",
        "isMain": true,
        "products": [
          {
            "name": "Заём",
            "instruments": [
              {
                "name": "Заём №1",
                "currency": "JPY",
                "balance": "АгроБаланс",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "JPY"
                  }
                ]
              }
            ]
          },
          {
            "name": "Гарантия",
            "instruments": [
              {
                "name": "Гарантия №1",
                "currency": "RUB",
                "balance": "СОКОЛ ФИНАНС",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "RUB"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "RUB"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1040": {
    "id": 1040,
    "productsDid": [
      {
        "name": "Кредитный мезонин",
        "isMain": true,
        "products": [
          {
            "name": "Конвертируемый заём",
            "instruments": [
              {
                "name": "Конвертируемый заём №1",
                "currency": "RUB",
                "balance": "ООО «СБИ»",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "RUB"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Корпоративный контроль",
        "isMain": false,
        "products": [
          {
            "name": "Доли в уставном капитале",
            "instruments": [
              {
                "name": "Доли в уставном капитале №1",
                "currency": "USD",
                "balance": "VPE CAPITAL",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "USD"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "USD"
                  }
                ]
              }
            ]
          },
          {
            "name": "Кредитная линия",
            "instruments": [
              {
                "name": "Кредитная линия №1",
                "currency": "RUB",
                "balance": "ООО «СБИ»",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "RUB"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1041": {
    "id": 1041,
    "productsDid": [
      {
        "name": "Корпоративный контроль",
        "isMain": true,
        "products": [
          {
            "name": "Доли в уставном капитале",
            "instruments": [
              {
                "name": "Доли в уставном капитале №1",
                "currency": "USD",
                "balance": "SBERFIN",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "USD"
                  }
                ]
              }
            ]
          },
          {
            "name": "Кредитная линия",
            "instruments": [
              {
                "name": "Кредитная линия №1",
                "currency": "EUR",
                "balance": "ЮГ ИНВЕСТ",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "EUR"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "EUR"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Долевое участие в капитале",
        "isMain": false,
        "products": [
          {
            "name": "Гарантия",
            "instruments": [
              {
                "name": "Гарантия №1",
                "currency": "USD",
                "balance": "SBERFIN",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "USD"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "USD"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Венчурное финансирование",
        "isMain": false,
        "products": [
          {
            "name": "Овердрафт",
            "instruments": [
              {
                "name": "Овердрафт №1",
                "currency": "EUR",
                "balance": "ЮГ ИНВЕСТ",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "EUR"
                  }
                ]
              }
            ]
          },
          {
            "name": "Акции",
            "instruments": [
              {
                "name": "Акции №1",
                "currency": "USD",
                "balance": "SBERFIN",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "USD"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "USD"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1042": {
    "id": 1042,
    "productsDid": [
      {
        "name": "Долевое участие в капитале",
        "isMain": true,
        "products": [
          {
            "name": "Гарантия",
            "instruments": [
              {
                "name": "Гарантия №1",
                "currency": "EUR",
                "balance": "СОКОЛ ФИНАНС",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "EUR"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1043": {
    "id": 1043,
    "productsDid": [
      {
        "name": "Венчурное финансирование",
        "isMain": true,
        "products": [
          {
            "name": "Овердрафт",
            "instruments": [
              {
                "name": "Овердрафт №1",
                "currency": "JPY",
                "balance": "VPE CAPITAL",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "JPY"
                  }
                ]
              }
            ]
          },
          {
            "name": "Акции",
            "instruments": [
              {
                "name": "Акции №1",
                "currency": "RUB",
                "balance": "ПромФинанс",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "RUB"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "RUB"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Акционерный мезонин",
        "isMain": false,
        "products": [
          {
            "name": "Кредитная линия",
            "instruments": [
              {
                "name": "Кредитная линия №1",
                "currency": "JPY",
                "balance": "VPE CAPITAL",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "JPY"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "JPY"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1044": {
    "id": 1044,
    "productsDid": [
      {
        "name": "Акционерный мезонин",
        "isMain": true,
        "products": [
          {
            "name": "Кредитная линия",
            "instruments": [
              {
                "name": "Кредитная линия №1",
                "currency": "RUB",
                "balance": "ЮГ ИНВЕСТ",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "RUB"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Кредитный мезонин",
        "isMain": false,
        "products": [
          {
            "name": "Опцион",
            "instruments": [
              {
                "name": "Опцион №1",
                "currency": "USD",
                "balance": "АгроБаланс",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "USD"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "USD"
                  }
                ]
              }
            ]
          },
          {
            "name": "Привилегированные акции",
            "instruments": [
              {
                "name": "Привилегированные акции №1",
                "currency": "RUB",
                "balance": "ЮГ ИНВЕСТ",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "RUB"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Корпоративный контроль",
        "isMain": false,
        "products": [
          {
            "name": "Акции",
            "instruments": [
              {
                "name": "Акции №1",
                "currency": "USD",
                "balance": "АгроБаланс",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "USD"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1045": {
    "id": 1045,
    "productsDid": [
      {
        "name": "Кредитный мезонин",
        "isMain": true,
        "products": [
          {
            "name": "Опцион",
            "instruments": [
              {
                "name": "Опцион №1",
                "currency": "USD",
                "balance": "ТрансКапитал",
                "isPE": true,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "USD"
                  }
                ]
              }
            ]
          },
          {
            "name": "Привилегированные акции",
            "instruments": [
              {
                "name": "Привилегированные акции №1",
                "currency": "EUR",
                "balance": "ООО «СБИ»",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "EUR"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "EUR"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1046": {
    "id": 1046,
    "productsDid": [
      {
        "name": "Корпоративный контроль",
        "isMain": true,
        "products": [
          {
            "name": "Акции",
            "instruments": [
              {
                "name": "Акции №1",
                "currency": "EUR",
                "balance": "ПромФинанс",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "EUR"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Долевое участие в капитале",
        "isMain": false,
        "products": [
          {
            "name": "Обыкновенные акции",
            "instruments": [
              {
                "name": "Обыкновенные акции №1",
                "currency": "JPY",
                "balance": "SBERFIN",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "JPY"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "JPY"
                  }
                ]
              }
            ]
          },
          {
            "name": "Конвертируемый заём",
            "instruments": [
              {
                "name": "Конвертируемый заём №1",
                "currency": "EUR",
                "balance": "ПромФинанс",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "EUR"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1047": {
    "id": 1047,
    "productsDid": [
      {
        "name": "Долевое участие в капитале",
        "isMain": true,
        "products": [
          {
            "name": "Обыкновенные акции",
            "instruments": [
              {
                "name": "Обыкновенные акции №1",
                "currency": "JPY",
                "balance": "АгроБаланс",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "JPY"
                  }
                ]
              }
            ]
          },
          {
            "name": "Конвертируемый заём",
            "instruments": [
              {
                "name": "Конвертируемый заём №1",
                "currency": "RUB",
                "balance": "СОКОЛ ФИНАНС",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "RUB"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "RUB"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Венчурное финансирование",
        "isMain": false,
        "products": [
          {
            "name": "Привилегированные акции",
            "instruments": [
              {
                "name": "Привилегированные акции №1",
                "currency": "JPY",
                "balance": "АгроБаланс",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "JPY"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "JPY"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Акционерный мезонин",
        "isMain": false,
        "products": [
          {
            "name": "Заём",
            "instruments": [
              {
                "name": "Заём №1",
                "currency": "RUB",
                "balance": "СОКОЛ ФИНАНС",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "RUB"
                  }
                ]
              }
            ]
          },
          {
            "name": "Гарантия",
            "instruments": [
              {
                "name": "Гарантия №1",
                "currency": "JPY",
                "balance": "АгроБаланс",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "JPY"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "JPY"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1048": {
    "id": 1048,
    "productsDid": [
      {
        "name": "Венчурное финансирование",
        "isMain": true,
        "products": [
          {
            "name": "Привилегированные акции",
            "instruments": [
              {
                "name": "Привилегированные акции №1",
                "currency": "RUB",
                "balance": "ООО «СБИ»",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "RUB"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1049": {
    "id": 1049,
    "productsDid": [
      {
        "name": "Акционерный мезонин",
        "isMain": true,
        "products": [
          {
            "name": "Заём",
            "instruments": [
              {
                "name": "Заём №1",
                "currency": "USD",
                "balance": "SBERFIN",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "USD"
                  }
                ]
              }
            ]
          },
          {
            "name": "Гарантия",
            "instruments": [
              {
                "name": "Гарантия №1",
                "currency": "EUR",
                "balance": "ЮГ ИНВЕСТ",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "EUR"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "EUR"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Кредитный мезонин",
        "isMain": false,
        "products": [
          {
            "name": "Конвертируемый заём",
            "instruments": [
              {
                "name": "Конвертируемый заём №1",
                "currency": "USD",
                "balance": "SBERFIN",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "USD"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "USD"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1050": {
    "id": 1050,
    "productsDid": [
      {
        "name": "Кредитный мезонин",
        "isMain": true,
        "products": [
          {
            "name": "Конвертируемый заём",
            "instruments": [
              {
                "name": "Конвертируемый заём №1",
                "currency": "EUR",
                "balance": "СОКОЛ ФИНАНС",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "EUR"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Корпоративный контроль",
        "isMain": false,
        "products": [
          {
            "name": "Доли в уставном капитале",
            "instruments": [
              {
                "name": "Доли в уставном капитале №1",
                "currency": "JPY",
                "balance": "ТрансКапитал",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "JPY"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "JPY"
                  }
                ]
              }
            ]
          },
          {
            "name": "Кредитная линия",
            "instruments": [
              {
                "name": "Кредитная линия №1",
                "currency": "EUR",
                "balance": "СОКОЛ ФИНАНС",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "EUR"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Долевое участие в капитале",
        "isMain": false,
        "products": [
          {
            "name": "Гарантия",
            "instruments": [
              {
                "name": "Гарантия №1",
                "currency": "JPY",
                "balance": "ТрансКапитал",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "JPY"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1051": {
    "id": 1051,
    "productsDid": [
      {
        "name": "Корпоративный контроль",
        "isMain": true,
        "products": [
          {
            "name": "Доли в уставном капитале",
            "instruments": [
              {
                "name": "Доли в уставном капитале №1",
                "currency": "JPY",
                "balance": "VPE CAPITAL",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "JPY"
                  }
                ]
              }
            ]
          },
          {
            "name": "Кредитная линия",
            "instruments": [
              {
                "name": "Кредитная линия №1",
                "currency": "RUB",
                "balance": "ПромФинанс",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "RUB"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "RUB"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1052": {
    "id": 1052,
    "productsDid": [
      {
        "name": "Долевое участие в капитале",
        "isMain": true,
        "products": [
          {
            "name": "Гарантия",
            "instruments": [
              {
                "name": "Гарантия №1",
                "currency": "RUB",
                "balance": "ЮГ ИНВЕСТ",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "RUB"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Венчурное финансирование",
        "isMain": false,
        "products": [
          {
            "name": "Овердрафт",
            "instruments": [
              {
                "name": "Овердрафт №1",
                "currency": "USD",
                "balance": "АгроБаланс",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "USD"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "USD"
                  }
                ]
              }
            ]
          },
          {
            "name": "Акции",
            "instruments": [
              {
                "name": "Акции №1",
                "currency": "RUB",
                "balance": "ЮГ ИНВЕСТ",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "RUB"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1053": {
    "id": 1053,
    "productsDid": [
      {
        "name": "Венчурное финансирование",
        "isMain": true,
        "products": [
          {
            "name": "Овердрафт",
            "instruments": [
              {
                "name": "Овердрафт №1",
                "currency": "USD",
                "balance": "ТрансКапитал",
                "isPE": true,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "USD"
                  }
                ]
              }
            ]
          },
          {
            "name": "Акции",
            "instruments": [
              {
                "name": "Акции №1",
                "currency": "EUR",
                "balance": "ООО «СБИ»",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "EUR"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "EUR"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Акционерный мезонин",
        "isMain": false,
        "products": [
          {
            "name": "Кредитная линия",
            "instruments": [
              {
                "name": "Кредитная линия №1",
                "currency": "USD",
                "balance": "ТрансКапитал",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "USD"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "USD"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Кредитный мезонин",
        "isMain": false,
        "products": [
          {
            "name": "Опцион",
            "instruments": [
              {
                "name": "Опцион №1",
                "currency": "EUR",
                "balance": "ООО «СБИ»",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "EUR"
                  }
                ]
              }
            ]
          },
          {
            "name": "Привилегированные акции",
            "instruments": [
              {
                "name": "Привилегированные акции №1",
                "currency": "USD",
                "balance": "ТрансКапитал",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "USD"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "USD"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1054": {
    "id": 1054,
    "productsDid": [
      {
        "name": "Акционерный мезонин",
        "isMain": true,
        "products": [
          {
            "name": "Кредитная линия",
            "instruments": [
              {
                "name": "Кредитная линия №1",
                "currency": "EUR",
                "balance": "ПромФинанс",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "EUR"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1055": {
    "id": 1055,
    "productsDid": [
      {
        "name": "Кредитный мезонин",
        "isMain": true,
        "products": [
          {
            "name": "Опцион",
            "instruments": [
              {
                "name": "Опцион №1",
                "currency": "JPY",
                "balance": "АгроБаланс",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "JPY"
                  }
                ]
              }
            ]
          },
          {
            "name": "Привилегированные акции",
            "instruments": [
              {
                "name": "Привилегированные акции №1",
                "currency": "RUB",
                "balance": "СОКОЛ ФИНАНС",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "RUB"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "RUB"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Корпоративный контроль",
        "isMain": false,
        "products": [
          {
            "name": "Акции",
            "instruments": [
              {
                "name": "Акции №1",
                "currency": "JPY",
                "balance": "АгроБаланс",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "JPY"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "JPY"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1056": {
    "id": 1056,
    "productsDid": [
      {
        "name": "Корпоративный контроль",
        "isMain": true,
        "products": [
          {
            "name": "Акции",
            "instruments": [
              {
                "name": "Акции №1",
                "currency": "RUB",
                "balance": "ООО «СБИ»",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "RUB"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Долевое участие в капитале",
        "isMain": false,
        "products": [
          {
            "name": "Обыкновенные акции",
            "instruments": [
              {
                "name": "Обыкновенные акции №1",
                "currency": "USD",
                "balance": "VPE CAPITAL",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "USD"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "USD"
                  }
                ]
              }
            ]
          },
          {
            "name": "Конвертируемый заём",
            "instruments": [
              {
                "name": "Конвертируемый заём №1",
                "currency": "RUB",
                "balance": "ООО «СБИ»",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "RUB"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Венчурное финансирование",
        "isMain": false,
        "products": [
          {
            "name": "Привилегированные акции",
            "instruments": [
              {
                "name": "Привилегированные акции №1",
                "currency": "USD",
                "balance": "VPE CAPITAL",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "USD"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1057": {
    "id": 1057,
    "productsDid": [
      {
        "name": "Долевое участие в капитале",
        "isMain": true,
        "products": [
          {
            "name": "Обыкновенные акции",
            "instruments": [
              {
                "name": "Обыкновенные акции №1",
                "currency": "USD",
                "balance": "SBERFIN",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "USD"
                  }
                ]
              }
            ]
          },
          {
            "name": "Конвертируемый заём",
            "instruments": [
              {
                "name": "Конвертируемый заём №1",
                "currency": "EUR",
                "balance": "ЮГ ИНВЕСТ",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "EUR"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "EUR"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1058": {
    "id": 1058,
    "productsDid": [
      {
        "name": "Венчурное финансирование",
        "isMain": true,
        "products": [
          {
            "name": "Привилегированные акции",
            "instruments": [
              {
                "name": "Привилегированные акции №1",
                "currency": "EUR",
                "balance": "СОКОЛ ФИНАНС",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "EUR"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Акционерный мезонин",
        "isMain": false,
        "products": [
          {
            "name": "Заём",
            "instruments": [
              {
                "name": "Заём №1",
                "currency": "JPY",
                "balance": "ТрансКапитал",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "JPY"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "JPY"
                  }
                ]
              }
            ]
          },
          {
            "name": "Гарантия",
            "instruments": [
              {
                "name": "Гарантия №1",
                "currency": "EUR",
                "balance": "СОКОЛ ФИНАНС",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "EUR"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1059": {
    "id": 1059,
    "productsDid": [
      {
        "name": "Акционерный мезонин",
        "isMain": true,
        "products": [
          {
            "name": "Заём",
            "instruments": [
              {
                "name": "Заём №1",
                "currency": "JPY",
                "balance": "VPE CAPITAL",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "JPY"
                  }
                ]
              }
            ]
          },
          {
            "name": "Гарантия",
            "instruments": [
              {
                "name": "Гарантия №1",
                "currency": "RUB",
                "balance": "ПромФинанс",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "RUB"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "RUB"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Кредитный мезонин",
        "isMain": false,
        "products": [
          {
            "name": "Конвертируемый заём",
            "instruments": [
              {
                "name": "Конвертируемый заём №1",
                "currency": "JPY",
                "balance": "VPE CAPITAL",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "JPY"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "JPY"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Корпоративный контроль",
        "isMain": false,
        "products": [
          {
            "name": "Доли в уставном капитале",
            "instruments": [
              {
                "name": "Доли в уставном капитале №1",
                "currency": "RUB",
                "balance": "ПромФинанс",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "RUB"
                  }
                ]
              }
            ]
          },
          {
            "name": "Кредитная линия",
            "instruments": [
              {
                "name": "Кредитная линия №1",
                "currency": "JPY",
                "balance": "VPE CAPITAL",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "JPY"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "JPY"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1060": {
    "id": 1060,
    "productsDid": [
      {
        "name": "Кредитный мезонин",
        "isMain": true,
        "products": [
          {
            "name": "Конвертируемый заём",
            "instruments": [
              {
                "name": "Конвертируемый заём №1",
                "currency": "RUB",
                "balance": "ЮГ ИНВЕСТ",
                "isPE": true,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "RUB"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1061": {
    "id": 1061,
    "productsDid": [
      {
        "name": "Корпоративный контроль",
        "isMain": true,
        "products": [
          {
            "name": "Доли в уставном капитале",
            "instruments": [
              {
                "name": "Доли в уставном капитале №1",
                "currency": "USD",
                "balance": "ТрансКапитал",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "USD"
                  }
                ]
              }
            ]
          },
          {
            "name": "Кредитная линия",
            "instruments": [
              {
                "name": "Кредитная линия №1",
                "currency": "EUR",
                "balance": "ООО «СБИ»",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "EUR"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "EUR"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Долевое участие в капитале",
        "isMain": false,
        "products": [
          {
            "name": "Гарантия",
            "instruments": [
              {
                "name": "Гарантия №1",
                "currency": "USD",
                "balance": "ТрансКапитал",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "USD"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "USD"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1062": {
    "id": 1062,
    "productsDid": [
      {
        "name": "Долевое участие в капитале",
        "isMain": true,
        "products": [
          {
            "name": "Гарантия",
            "instruments": [
              {
                "name": "Гарантия №1",
                "currency": "EUR",
                "balance": "ПромФинанс",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "EUR"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Венчурное финансирование",
        "isMain": false,
        "products": [
          {
            "name": "Овердрафт",
            "instruments": [
              {
                "name": "Овердрафт №1",
                "currency": "JPY",
                "balance": "SBERFIN",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "JPY"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "JPY"
                  }
                ]
              }
            ]
          },
          {
            "name": "Акции",
            "instruments": [
              {
                "name": "Акции №1",
                "currency": "EUR",
                "balance": "ПромФинанс",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "EUR"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Акционерный мезонин",
        "isMain": false,
        "products": [
          {
            "name": "Кредитная линия",
            "instruments": [
              {
                "name": "Кредитная линия №1",
                "currency": "JPY",
                "balance": "SBERFIN",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "JPY"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1063": {
    "id": 1063,
    "productsDid": [
      {
        "name": "Венчурное финансирование",
        "isMain": true,
        "products": [
          {
            "name": "Овердрафт",
            "instruments": [
              {
                "name": "Овердрафт №1",
                "currency": "JPY",
                "balance": "АгроБаланс",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "JPY"
                  }
                ]
              }
            ]
          },
          {
            "name": "Акции",
            "instruments": [
              {
                "name": "Акции №1",
                "currency": "RUB",
                "balance": "СОКОЛ ФИНАНС",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "RUB"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "RUB"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1064": {
    "id": 1064,
    "productsDid": [
      {
        "name": "Акционерный мезонин",
        "isMain": true,
        "products": [
          {
            "name": "Кредитная линия",
            "instruments": [
              {
                "name": "Кредитная линия №1",
                "currency": "RUB",
                "balance": "ООО «СБИ»",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "RUB"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Кредитный мезонин",
        "isMain": false,
        "products": [
          {
            "name": "Опцион",
            "instruments": [
              {
                "name": "Опцион №1",
                "currency": "USD",
                "balance": "VPE CAPITAL",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "USD"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "USD"
                  }
                ]
              }
            ]
          },
          {
            "name": "Привилегированные акции",
            "instruments": [
              {
                "name": "Привилегированные акции №1",
                "currency": "RUB",
                "balance": "ООО «СБИ»",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "RUB"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1065": {
    "id": 1065,
    "productsDid": [
      {
        "name": "Кредитный мезонин",
        "isMain": true,
        "products": [
          {
            "name": "Опцион",
            "instruments": [
              {
                "name": "Опцион №1",
                "currency": "USD",
                "balance": "SBERFIN",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "USD"
                  }
                ]
              }
            ]
          },
          {
            "name": "Привилегированные акции",
            "instruments": [
              {
                "name": "Привилегированные акции №1",
                "currency": "EUR",
                "balance": "ЮГ ИНВЕСТ",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "EUR"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "EUR"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Корпоративный контроль",
        "isMain": false,
        "products": [
          {
            "name": "Акции",
            "instruments": [
              {
                "name": "Акции №1",
                "currency": "USD",
                "balance": "SBERFIN",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "USD"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "USD"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Долевое участие в капитале",
        "isMain": false,
        "products": [
          {
            "name": "Обыкновенные акции",
            "instruments": [
              {
                "name": "Обыкновенные акции №1",
                "currency": "EUR",
                "balance": "ЮГ ИНВЕСТ",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "EUR"
                  }
                ]
              }
            ]
          },
          {
            "name": "Конвертируемый заём",
            "instruments": [
              {
                "name": "Конвертируемый заём №1",
                "currency": "USD",
                "balance": "SBERFIN",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "USD"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "USD"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1066": {
    "id": 1066,
    "productsDid": [
      {
        "name": "Корпоративный контроль",
        "isMain": true,
        "products": [
          {
            "name": "Акции",
            "instruments": [
              {
                "name": "Акции №1",
                "currency": "EUR",
                "balance": "СОКОЛ ФИНАНС",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "EUR"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1067": {
    "id": 1067,
    "productsDid": [
      {
        "name": "Долевое участие в капитале",
        "isMain": true,
        "products": [
          {
            "name": "Обыкновенные акции",
            "instruments": [
              {
                "name": "Обыкновенные акции №1",
                "currency": "JPY",
                "balance": "VPE CAPITAL",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "JPY"
                  }
                ]
              }
            ]
          },
          {
            "name": "Конвертируемый заём",
            "instruments": [
              {
                "name": "Конвертируемый заём №1",
                "currency": "RUB",
                "balance": "ПромФинанс",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "RUB"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "RUB"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Венчурное финансирование",
        "isMain": false,
        "products": [
          {
            "name": "Привилегированные акции",
            "instruments": [
              {
                "name": "Привилегированные акции №1",
                "currency": "JPY",
                "balance": "VPE CAPITAL",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "JPY"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "JPY"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1068": {
    "id": 1068,
    "productsDid": [
      {
        "name": "Венчурное финансирование",
        "isMain": true,
        "products": [
          {
            "name": "Привилегированные акции",
            "instruments": [
              {
                "name": "Привилегированные акции №1",
                "currency": "RUB",
                "balance": "ЮГ ИНВЕСТ",
                "isPE": true,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "RUB"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Акционерный мезонин",
        "isMain": false,
        "products": [
          {
            "name": "Заём",
            "instruments": [
              {
                "name": "Заём №1",
                "currency": "USD",
                "balance": "АгроБаланс",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "USD"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "USD"
                  }
                ]
              }
            ]
          },
          {
            "name": "Гарантия",
            "instruments": [
              {
                "name": "Гарантия №1",
                "currency": "RUB",
                "balance": "ЮГ ИНВЕСТ",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "RUB"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Кредитный мезонин",
        "isMain": false,
        "products": [
          {
            "name": "Конвертируемый заём",
            "instruments": [
              {
                "name": "Конвертируемый заём №1",
                "currency": "USD",
                "balance": "АгроБаланс",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "USD"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1069": {
    "id": 1069,
    "productsDid": [
      {
        "name": "Акционерный мезонин",
        "isMain": true,
        "products": [
          {
            "name": "Заём",
            "instruments": [
              {
                "name": "Заём №1",
                "currency": "USD",
                "balance": "ТрансКапитал",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "USD"
                  }
                ]
              }
            ]
          },
          {
            "name": "Гарантия",
            "instruments": [
              {
                "name": "Гарантия №1",
                "currency": "EUR",
                "balance": "ООО «СБИ»",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "EUR"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "EUR"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1070": {
    "id": 1070,
    "productsDid": [
      {
        "name": "Кредитный мезонин",
        "isMain": true,
        "products": [
          {
            "name": "Конвертируемый заём",
            "instruments": [
              {
                "name": "Конвертируемый заём №1",
                "currency": "EUR",
                "balance": "ПромФинанс",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "EUR"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Корпоративный контроль",
        "isMain": false,
        "products": [
          {
            "name": "Доли в уставном капитале",
            "instruments": [
              {
                "name": "Доли в уставном капитале №1",
                "currency": "JPY",
                "balance": "SBERFIN",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "JPY"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "JPY"
                  }
                ]
              }
            ]
          },
          {
            "name": "Кредитная линия",
            "instruments": [
              {
                "name": "Кредитная линия №1",
                "currency": "EUR",
                "balance": "ПромФинанс",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "EUR"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1071": {
    "id": 1071,
    "productsDid": [
      {
        "name": "Корпоративный контроль",
        "isMain": true,
        "products": [
          {
            "name": "Доли в уставном капитале",
            "instruments": [
              {
                "name": "Доли в уставном капитале №1",
                "currency": "JPY",
                "balance": "АгроБаланс",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "JPY"
                  }
                ]
              }
            ]
          },
          {
            "name": "Кредитная линия",
            "instruments": [
              {
                "name": "Кредитная линия №1",
                "currency": "RUB",
                "balance": "СОКОЛ ФИНАНС",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "RUB"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "RUB"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Долевое участие в капитале",
        "isMain": false,
        "products": [
          {
            "name": "Гарантия",
            "instruments": [
              {
                "name": "Гарантия №1",
                "currency": "JPY",
                "balance": "АгроБаланс",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "JPY"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "JPY"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Венчурное финансирование",
        "isMain": false,
        "products": [
          {
            "name": "Овердрафт",
            "instruments": [
              {
                "name": "Овердрафт №1",
                "currency": "RUB",
                "balance": "СОКОЛ ФИНАНС",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "RUB"
                  }
                ]
              }
            ]
          },
          {
            "name": "Акции",
            "instruments": [
              {
                "name": "Акции №1",
                "currency": "JPY",
                "balance": "АгроБаланс",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "JPY"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "JPY"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1072": {
    "id": 1072,
    "productsDid": [
      {
        "name": "Долевое участие в капитале",
        "isMain": true,
        "products": [
          {
            "name": "Гарантия",
            "instruments": [
              {
                "name": "Гарантия №1",
                "currency": "RUB",
                "balance": "ООО «СБИ»",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "RUB"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "1073": {
    "id": 1073,
    "productsDid": [
      {
        "name": "Венчурное финансирование",
        "isMain": true,
        "products": [
          {
            "name": "Овердрафт",
            "instruments": [
              {
                "name": "Овердрафт №1",
                "currency": "USD",
                "balance": "SBERFIN",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "USD"
                  }
                ]
              }
            ]
          },
          {
            "name": "Акции",
            "instruments": [
              {
                "name": "Акции №1",
                "currency": "EUR",
                "balance": "ЮГ ИНВЕСТ",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "EUR"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "EUR"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "name": "Акционерный мезонин",
        "isMain": false,
        "products": [
          {
            "name": "Кредитная линия",
            "instruments": [
              {
                "name": "Кредитная линия №1",
                "currency": "USD",
                "balance": "SBERFIN",
                "isPE": false,
                "tranches": [
                  {
                    "name": "Транш 1",
                    "currency": "USD"
                  },
                  {
                    "name": "Транш 2",
                    "currency": "USD"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
};
