import { http, createConfig, injected } from '@wagmi/core';
import { odysseyTestnet } from '@wagmi/core/chains';

const config = createConfig({
  connectors: [injected()],
  multiInjectedProviderDiscovery: true,
  chains: [odysseyTestnet],
  transports: {
    [odysseyTestnet.id]: http(),
  },
});

// eslint-disable-next-line import-x/prefer-default-export
export { config };
