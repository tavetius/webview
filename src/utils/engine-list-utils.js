const ENGINES = [
  'stockfish10',
  'lc0',
  'asmfish',
  'sugar',
  'berserk',
  'koivisto',
  'rubichess',
  'shashchess',
  'komodo',
];

export const ENGINES_NAMES = {
  asmfish: 'AsmFish',
  stockfish10: 'Stockfish 16',
  sugar: 'Sugar AI',
  lc0: 'LCZero 0.30',
  berserk: 'Berserk 12',
  koivisto: 'Koivisto',
  rubichess: 'RubiChess',
  shashchess: 'ShashChess',
  komodo: 'Komodo D3.2',
};

export function getEnginesListFromAvailableServers(
  availableServers,
  userFullInfo
) {
  const subscription = userFullInfo.subscription
    ? userFullInfo.subscription
    : {};

  const orderedServers = {};
  const result = {};
  const servers = {
    asmfish: [8, 16, 32, 128],
    berserk: [8, 16, 32, 128],
    koivisto: [8, 16, 32, 128],
    rubichess: [8, 16, 32, 128],
    shashchess: [8, 16, 32, 128],
    komodo: [129],
    sugar: [8, 16, 32, 128],
    stockfish10: [8, 16, 32, 128, 160, 352, 768, 512],
    lc0: [100],
  };
  const orderedEngines = orderedServers && Object.keys(orderedServers);

  ENGINES.forEach((engine) => {
    if (orderedEngines.indexOf(engine) !== -1) {
      result[engine] = [orderedServers[engine][0]];
    } else {
      const res = [];
      const index = {};
      if (availableServers && availableServers.length) {
        availableServers.forEach((s) => {
          if (servers[engine].indexOf(s.cores) !== -1) {
            if (!index[s.cores]) {
              index[s.cores] = true;
              res.push(s);
            }
          }
        });
      }

      res.sort((a, b) => {
        return a.cores - b.cores;
      });

      if (res.length) {
        if (subscription && userFullInfo.balance <= 0) {
          res.push();
        } else {
          res.push(res.shift());
        }
        result[engine] = res;
      }
    }
  });
  return result;
}

export function coreToKNode(engineIndex, item, selectedEngine) {
  if (item == undefined) {
    console.log("coreToKNode")
    return null;
  }

  const engine = engineIndex !== null ? ENGINES[engineIndex] : selectedEngine;
  const { cores } = item;

  const table = {
    sugar: {
      8: {
        average: '1,000',
        caption: '1 MN/s',
      },
      16: {
        average: '10,000',
        caption: '10 MN/s',
      },
      32: {
        average: '100,000',
        caption: '25-100 MN/s',
      },
      128: {
        average: '130,000',
        caption: '130 MN/s',
      },
    },
    stockfish10: {
      8: {
        average: '1,000',
        caption: '1 MN/s',
      },
      16: {
        average: '10,000',
        caption: '10 MN/s',
      },
      32: {
        average: '100,000',
        caption: '25-100 MN/s',
      },
      128: {
        average: '130,000',
        caption: '130 MN/s',
      },
      160: {
        average: '300,000',
        caption: '300 MN/s',
      },
      352: {
        average: '700,000',
        caption: '700 MN/s',
      },
      512: {
        average: '1,000,000',
        caption: '1 BN/s',
      },
      768: {
        average: '1,500,000',
        caption: '1.5 BN/s',
      },
      1024: {
        average: '2,000,000',
        caption: '2 BN/s',
      },
    },
    asmfish: {
      8: {
        average: '1,000',
        caption: '1 MN/s',
      },
      16: {
        average: '10,000',
        caption: '10 MN/s',
      },
      32: {
        average: '100,000',
        caption: '25-100 MN/s',
      },
      128: {
        average: '130,000',
        caption: '130 MN/s',
      },
    },
    berserk: {
      8: {
        average: '1,000',
        caption: '1 MN/s',
      },
      16: {
        average: '10,000',
        caption: '10 MN/s',
      },
      32: {
        average: '100,000',
        caption: '25-100 MN/s',
      },
      128: {
        average: '130,000',
        caption: '130 MN/s',
      },
    },
    koivisto: {
      8: {
        average: '1,000',
        caption: '1 MN/s',
      },
      16: {
        average: '10,000',
        caption: '10 MN/s',
      },
      32: {
        average: '100,000',
        caption: '25-100 MN/s',
      },
      128: {
        average: '130,000',
        caption: '130 MN/s',
      },
    },
    rubichess: {
      8: {
        average: '1,000',
        caption: '1 MN/s',
      },
      16: {
        average: '10,000',
        caption: '10 MN/s',
      },
      32: {
        average: '100,000',
        caption: '25-100 MN/s',
      },
      128: {
        average: '130,000',
        caption: '130 MN/s',
      },
    },
    shashchess: {
      8: {
        average: '1,000',
        caption: '1 MN/s',
      },
      16: {
        average: '10,000',
        caption: '10 MN/s',
      },
      32: {
        average: '100,000',
        caption: '25-100 MN/s',
      },
      128: {
        average: '130,000',
        caption: '130 MN/s',
      },
    },
    komodo: {
      129: {
        average: '90,000',
        caption: '90 MN/s',
      },
    },
    lc0: {
      100: {
        average: '100',
        caption: '100 kN/s',
      },
    },
  };

  if (!table[engine] || !(cores in table[engine])) {
    return {
      average: '123,456',
      caption: '123 MN/s',
    };
  }


  return table[engine][cores].caption;
}

export function disabledEngineCore(userFullInfo, item) {
  const { balance, subscription } = userFullInfo;
  const { cores } = item

  if (item == undefined) {
    return true;
  }
  if (cores === 8) {
    if (!subscription) {
      return true;
    }
  }

  if (cores === 16) {
    if (!subscription) {
      return false;
    }
    if (subscription) {
      if (
        parseInt(subscription.product_id) === 15 ||
        parseInt(subscription.product_id) === 16 ||
        parseInt(subscription.product_id) === 26 ||
        parseInt(subscription.product_id) === 27
      ) {
        return true;
      }
    }
  }

  if (cores === 32) {
    if (
      !subscription ||
      parseInt(subscription.product_id) === 15 ||
      parseInt(subscription.product_id) === 16 ||
      parseInt(subscription.product_id) === 26 ||
      parseInt(subscription.product_id) === 27
    ) {
      return false;
    } else if (subscription) {
      return true;
    }
  }
  if (cores > 32) {
    if (balance > 0) {
      return true;
    }
    if (cores === 100) {
      if (
        subscription &&
        (parseInt(subscription.product_id) === 22 ||
          parseInt(subscription.product_id) === 23 ||
          parseInt(subscription.product_id) === 25)
      ) {
        if (new Date(subscription.valid_till) >= Date.now()) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }
    return false;
  }
}

export function showAnalyzeButton(user, item, pricePerMinute) {
  if (item == undefined) {
    return true
  }

  const { subscription, balance } = user;
  const { cores } = item

  if (cores === 8) {
    return true;
  }

  if (cores === 16) {
    if (subscription) {
      if (new Date(subscription.valid_till) >= Date.now()) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  if (cores === 32) {
    if (
      !subscription ||
      parseInt(subscription.product_id) === 15 ||
      parseInt(subscription.product_id) === 16 ||
      parseInt(subscription.product_id) === 26 ||
      parseInt(subscription.product_id) === 27
    ) {
      return false;
    } else if (subscription) {
      if (new Date(subscription.valid_till) >= Date.now()) {
        return true;
      } else {
        return false;
      }
    }
  }

  if (cores > 32) {
    if (balance > 0) {
      return true;
    }
    if (cores === 100) {
      if (
        subscription &&
        (parseInt(subscription.product_id) === 22 ||
          parseInt(subscription.product_id) === 23 ||
          parseInt(subscription.product_id) === 25)
      ) {
        if (new Date(subscription.valid_till) >= Date.now()) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }
    return false;
  }

}

export function getOrderedSeversInfoFromUserInfo(userFullInfo) {
  const servers = userFullInfo.servers || {};

  const result = [];

  if (Object.keys(servers).length > 0) {
    const serversName = Object.keys(servers);

    serversName.forEach((element) => {
      result.push({
        name: element,
        cores: servers[element][0].cores,
        price: servers[element][0].price_per_minute,
      });
    });
  }

  console.log(result);
  return result;
}
