interface EnvironmentVariables {
  bundlerRpc: string;
}

function useEnv(): EnvironmentVariables {
  const env = (import.meta as ImportMeta).env;
  return {
    bundlerRpc: env.VITE_BUNDLER_RPC || '',
  };
}

export default useEnv;
