import { http, createConfig, createStorage, cookieStorage } from '@wagmi/core';
import { odysseyTestnet } from '@wagmi/core/chains';

const config = createConfig({
  chains: [odysseyTestnet],
  transports: {
    [odysseyTestnet.id]: http(),
  },
  storage: createStorage({
    storage: cookieStorage,
  }),
});

// eslint-disable-next-line import/prefer-default-export
export { config };
