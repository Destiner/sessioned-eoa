import { http, createConfig } from '@wagmi/core';
import { odysseyTestnet } from '@wagmi/core/chains';

const config = createConfig({
  chains: [odysseyTestnet],
  transports: {
    [odysseyTestnet.id]: http(),
  },
});

// eslint-disable-next-line import/prefer-default-export
export { config };
