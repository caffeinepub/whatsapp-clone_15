import { useInternetIdentity } from './useInternetIdentity';
import { useGetCallerUserProfile } from './useQueries';

export function useAuthFlow() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
    isError: profileError,
  } = useGetCallerUserProfile();

  // Show profile setup when:
  // - user is authenticated
  // - profile query has settled (fetched or errored)
  // - profile is null (not yet registered)
  const profileSettled = profileFetched || profileError;
  const showProfileSetup =
    isAuthenticated && !profileLoading && profileSettled && (userProfile === null || userProfile === undefined);

  const isReady = !isInitializing && (!isAuthenticated || profileSettled);

  return {
    isAuthenticated,
    isInitializing,
    userProfile: userProfile ?? null,
    profileLoading,
    profileFetched,
    showProfileSetup,
    isReady,
  };
}
