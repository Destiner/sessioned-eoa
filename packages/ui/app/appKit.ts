import { createAppKit, useAppKit } from '@reown/appkit/vue';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { odysseyTestnet } from 'viem/chains';

const projectId = 'YOUR_PROJECT_ID';
const networks = [odysseyTestnet];

const wagmiAdapter = new WagmiAdapter({
  ssr: false,
  projectId,
  networks,
});

createAppKit({
  adapters: [wagmiAdapter],
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  networks,
  projectId,
  features: {
    analytics: false,
    swaps: false,
    onramp: false,
    email: false,
    socials: [],
  },
});

useAppKit();
