import { http, createConfig } from '@wagmi/core';
import { odysseyTestnet } from '@wagmi/core/chains';

const config = createConfig({
  chains: [odysseyTestnet],
  transports: {
    [odysseyTestnet.id]: http(),
  },
});

// eslint-disable-next-line import-x/prefer-default-export
export { config };
