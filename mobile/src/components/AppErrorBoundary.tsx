import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/src/theme';

type State = { error: Error | null };
type GlobalErrorUtils = { getGlobalHandler?: () => (error: Error, isFatal?: boolean) => void; setGlobalHandler?: (handler: (error: Error, isFatal?: boolean) => void) => void };

/**
 * Production safety net for JavaScript / React rendering failures.
 * It replaces a blank closed-looking screen with a recoverable error screen.
 * Native Android process crashes, device OOM kills, and malformed APK installs
 * cannot be caught in JavaScript and still require Android Logcat investigation.
 */
export class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };
  private previousHandler?: (error: Error, isFatal?: boolean) => void;

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidMount() {
    // ErrorUtils is supplied by React Native. Keep the normal red developer
    // error screen in development; production users see the recovery screen.
    if (!__DEV__) {
      const errorUtils = (globalThis as typeof globalThis & { ErrorUtils?: GlobalErrorUtils }).ErrorUtils;
      this.previousHandler = errorUtils?.getGlobalHandler?.();
      errorUtils?.setGlobalHandler?.((error) => this.setState({ error }));
    }
  }

  componentWillUnmount() {
    const errorUtils = (globalThis as typeof globalThis & { ErrorUtils?: GlobalErrorUtils }).ErrorUtils;
    if (this.previousHandler) errorUtils?.setGlobalHandler?.(this.previousHandler);
  }

  retry = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={styles.page}>
        <View style={styles.icon}><Text style={styles.iconText}>!</Text></View>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.message}>Gurukul could not load this screen. Your saved information is safe.</Text>
        <Pressable onPress={this.retry} style={styles.button}><Text style={styles.buttonText}>Try again</Text></Pressable>
        {__DEV__ && <Text style={styles.debug}>{this.state.error.message}</Text>}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.canvas, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  icon: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.redSoft, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  iconText: { color: Colors.red, fontSize: 30, fontWeight: '800' },
  title: { color: Colors.ink, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  message: { color: Colors.muted, fontSize: 14, textAlign: 'center', lineHeight: 21, marginTop: Spacing.sm, maxWidth: 300 },
  button: { backgroundColor: Colors.accent, borderRadius: 10, paddingVertical: 13, paddingHorizontal: 28, marginTop: Spacing.xl },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  debug: { color: Colors.redText, marginTop: Spacing.lg, fontSize: 11, textAlign: 'center' },
});
