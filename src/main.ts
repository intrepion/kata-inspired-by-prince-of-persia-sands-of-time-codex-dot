// The original adventure and its save remain available independently.
if (new URLSearchParams(location.search).has('legacy')) void import('./legacy');
else void import('./courtyard/main');
