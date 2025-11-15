// Configuración de Jest para React Native
import '@testing-library/jest-native/extend-expect';

// Mocks para módulos nativos no disponibles en entorno de Jest

jest.mock('react-native-webview', () => {
	const React = require('react');
	const MockWebView = () => null;
	return {
		__esModule: true,
		default: MockWebView,
		WebView: MockWebView,
	};
});

jest.mock('react-native-safe-area-context', () => {
	return {
		__esModule: true,
		SafeAreaProvider: ({ children }) => children,
		SafeAreaView: ({ children }) => children,
		useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
	};
});

jest.mock('@react-native-async-storage/async-storage', () => ({
	setItem: jest.fn(),
	getItem: jest.fn(),
	removeItem: jest.fn(),
	clear: jest.fn(),
}));

jest.mock('@react-native-community/netinfo', () => ({
	addEventListener: jest.fn(() => jest.fn()),
	fetch: jest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
}));

jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

jest.mock('@react-navigation/native', () => ({
	useNavigation: () => ({
		navigate: jest.fn(),
		goBack: jest.fn(),
	}),
	useRoute: () => ({
		params: {},
	}),
	useFocusEffect: jest.fn((callback) => callback()),
}));

jest.mock('./src/contexts/AuthContext', () => ({
	useAuth: () => ({
		user: { uid: 'test-user' },
		userProfile: { role: 'admin' },
		isAuthenticated: true,
	}),
	AuthProvider: ({ children }) => children,
}));

jest.mock('./src/contexts/ToastContext', () => ({
	useToast: () => ({
		success: jest.fn(),
		error: jest.fn(),
		warning: jest.fn(),
		info: jest.fn(),
	}),
	ToastProvider: ({ children }) => children,
}));

jest.mock('./src/hooks/useOfflineStorage', () => ({
	useOfflineStorage: () => ({
		isOnline: true,
		pendingSyncCount: 0,
		syncNow: jest.fn(),
	}),
	useOfflineClientes: () => ({
		clientes: [],
		addCliente: jest.fn(),
		loading: false,
	}),
	useOfflineProductos: () => ({
		productos: [],
		addProducto: jest.fn(),
		loading: false,
	}),
	useOfflineCompras: () => ({
		compras: [],
		addCompra: jest.fn(),
		loading: false,
	}),
}));

