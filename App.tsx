// App.tsx

import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import MarketplaceScreen from './src/screens/MarketplaceScreen';
import HomeScreen from './src/screens/HomeScreen';
import CartScreen from './src/screens/CartScreen';
import LoginScreen from './src/screens/LoginScreen';
import AccountScreen from './src/screens/AccountScreen';
import SectionScreen from './src/screens/SectionScreen';
import BlogScreen from './src/screens/BlogScreen';
import VetScreen from './src/screens/VetScreen';
import VetChatScreen from './src/screens/VetChatScreen';
import VetCallScreen from './src/screens/VetCallScreen';
import BlogDetailScreen from './src/screens/BlogDetailScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import PaymentsScreen from './src/screens/PaymentsScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import { AuthProvider } from './src/context/AuthContext';
import colors from './src/theme/colors';

export type RootStackParamList = {
  Home: undefined;
  Marketplace: undefined;
  Cart: undefined;
  Login: undefined;
  Account: undefined;
  Blog: undefined;
  Vet: undefined;
  VetChat: { vet?: Record<string, unknown> };
  VetCall: { vet?: Record<string, unknown> };
  Phr: undefined;
  Parser: undefined;
  BlogDetail: { blogId: string };
  ProductDetail: { itemId: string };
  Payments: undefined;
  Orders: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Marketplace" component={MarketplaceScreen} />
            <Stack.Screen name="Cart" component={CartScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Account" component={AccountScreen} />
            <Stack.Screen name="Blog" component={BlogScreen} />
            <Stack.Screen name="BlogDetail" component={BlogDetailScreen} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
            <Stack.Screen name="Payments" component={PaymentsScreen} />
            <Stack.Screen name="Orders" component={OrdersScreen} />
            <Stack.Screen name="Vet" component={VetScreen} />
            <Stack.Screen name="VetChat" component={VetChatScreen} />
            <Stack.Screen name="VetCall" component={VetCallScreen} />
            <Stack.Screen name="Phr" component={SectionScreen} initialParams={{ title: 'Patient PHR' }} />
            <Stack.Screen name="Parser" component={SectionScreen} initialParams={{ title: 'Q&A' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}