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
  Phr: undefined;
  Parser: undefined;
  // Payments: undefined;
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
            <Stack.Screen name="Blog" component={SectionScreen} initialParams={{ title: 'Blog' }} />
            <Stack.Screen name="Vet" component={SectionScreen} initialParams={{ title: 'Consult a Vet' }} />
            <Stack.Screen name="Phr" component={SectionScreen} initialParams={{ title: 'Patient PHR' }} />
            <Stack.Screen name="Parser" component={SectionScreen} initialParams={{ title: 'Q&A' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}