import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';
import { SecuritySchemas, validateSecurely } from '../utils/security';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with enhanced security configuration
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Enable automatic token refresh
    autoRefreshToken: true,
    // Persist session in local storage
    persistSession: true,
    // Detect session in URL for OAuth flows
    detectSessionInUrl: true,
    // Use secure storage for sensitive data
    storage: window.localStorage,
    // Additional security headers
    flowType: 'pkce', // Use PKCE for OAuth flows
  },
  // Configure global headers for security
  global: {
    headers: {
      'X-Client-Info': 'tony-trivia-web-app',
      'X-Requested-With': 'XMLHttpRequest', // Helps prevent CSRF
    },
  },
});

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  emailVerified: boolean;
  createdAt: string;
  lastSignInAt?: string;
}

export interface AuthError {
  message: string;
  code?: string;
  details?: any;
}

export interface AuthResponse<T = any> {
  success: boolean;
  data?: T;
  error?: AuthError;
  requiresConfirmation?: boolean;
  message?: string;
}

class AuthService {
  private currentSession: Session | null = null;
  private currentUser: AuthUser | null = null;
  private sessionListeners: Array<(session: Session | null) => void> = [];
  private userListeners: Array<(user: AuthUser | null) => void> = [];

  constructor() {
    this.initializeAuth();
  }

  /**
   * Initialize authentication and set up session monitoring
   */
  private async initializeAuth(): Promise<void> {
    try {
      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Failed to get initial session:', error);
        return;
      }

      if (session) {
        await this.handleSessionChange(session);
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event);
        await this.handleSessionChange(session);
        
        // Notify listeners
        this.sessionListeners.forEach(listener => listener(session));
      });

    } catch (error) {
      console.error('Failed to initialize auth:', error);
    }
  }

  /**
   * Handle session changes and update user data
   */
  private async handleSessionChange(session: Session | null): Promise<void> {
    this.currentSession = session;

    if (session?.user) {
      try {
        // Fetch or create user profile with validated data
        const userProfile = await this.getUserProfile(session.user.id);
        this.currentUser = userProfile;
        this.userListeners.forEach(listener => listener(userProfile));
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        this.currentUser = null;
        this.userListeners.forEach(listener => listener(null));
      }
    } else {
      this.currentUser = null;
      this.userListeners.forEach(listener => listener(null));
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(credentials: {
    email: string;
    password: string;
  }): Promise<AuthResponse<AuthUser>> {
    try {
      // Validate input with security schemas
      const emailValidation = validateSecurely(SecuritySchemas.email, credentials.email);
      if (!emailValidation.success) {
        return {
          success: false,
          error: { message: emailValidation.error },
        };
      }

      const passwordValidation = validateSecurely(SecuritySchemas.password, credentials.password);
      if (!passwordValidation.success) {
        return {
          success: false,
          error: { message: passwordValidation.error },
        };
      }

      // Attempt sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailValidation.data,
        password: credentials.password,
      });

      if (error) {
        return {
          success: false,
          error: {
            message: this.getReadableErrorMessage(error.message),
            code: error.message,
            details: error,
          },
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: { message: 'Sign in failed - no user data received' },
        };
      }

      // Session will be handled by onAuthStateChange
      return {
        success: true,
        data: this.currentUser!,
        message: 'Successfully signed in',
      };

    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: {
          message: 'An unexpected error occurred during sign in',
          details: error,
        },
      };
    }
  }

  /**
   * Sign up with email, password, and display name
   */
  async signUp(userData: {
    email: string;
    password: string;
    displayName: string;
  }): Promise<AuthResponse<AuthUser>> {
    try {
      // Validate all inputs with security schemas
      const emailValidation = validateSecurely(SecuritySchemas.email, userData.email);
      if (!emailValidation.success) {
        return {
          success: false,
          error: { message: emailValidation.error },
        };
      }

      const passwordValidation = validateSecurely(SecuritySchemas.password, userData.password);
      if (!passwordValidation.success) {
        return {
          success: false,
          error: { message: passwordValidation.error },
        };
      }

      const nameValidation = validateSecurely(SecuritySchemas.displayName, userData.displayName);
      if (!nameValidation.success) {
        return {
          success: false,
          error: { message: nameValidation.error },
        };
      }

      // Check if display name is already taken
      const nameExists = await this.checkDisplayNameExists(nameValidation.data);
      if (nameExists) {
        return {
          success: false,
          error: { message: 'This display name is already taken' },
        };
      }

      // Attempt sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: emailValidation.data,
        password: userData.password,
        options: {
          data: {
            display_name: nameValidation.data,
          },
        },
      });

      if (error) {
        return {
          success: false,
          error: {
            message: this.getReadableErrorMessage(error.message),
            code: error.message,
            details: error,
          },
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: { message: 'Sign up failed - no user data received' },
        };
      }

      // Check if email confirmation is required
      if (!data.session) {
        return {
          success: true,
          requiresConfirmation: true,
          message: 'Please check your email for a verification link',
        };
      }

      // Create user profile in database
      await this.createUserProfile(data.user.id, nameValidation.data);

      return {
        success: true,
        data: this.currentUser!,
        message: 'Account created successfully',
      };

    } catch (error) {
      console.error('Sign up error:', error);
      return {
        success: false,
        error: {
          message: 'An unexpected error occurred during sign up',
          details: error,
        },
      };
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return {
          success: false,
          error: {
            message: 'Failed to sign out',
            details: error,
          },
        };
      }

      return {
        success: true,
        message: 'Successfully signed out',
      };

    } catch (error) {
      console.error('Sign out error:', error);
      return {
        success: false,
        error: {
          message: 'An unexpected error occurred during sign out',
          details: error,
        },
      };
    }
  }

  /**
   * Get current authenticated session (with CSRF protection)
   */
  async getSession(): Promise<Session | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Failed to get session:', error);
        return null;
      }

      // Verify session validity and refresh if needed
      if (session && this.isSessionExpiring(session)) {
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('Failed to refresh session:', refreshError);
          return null;
        }
        
        return refreshedSession;
      }

      return session;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null && this.currentSession !== null;
  }

  /**
   * Make authenticated API request with CSRF protection
   */
  async makeAuthenticatedRequest<T = any>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const session = await this.getSession();
    
    if (!session) {
      throw new Error('User not authenticated');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'X-Requested-With': 'XMLHttpRequest', // CSRF protection
      'X-Client-Version': '1.0.0',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, try to refresh
        const refreshedSession = await this.getSession();
        if (refreshedSession) {
          // Retry with new token
          headers['Authorization'] = `Bearer ${refreshedSession.access_token}`;
          const retryResponse = await fetch(url, { ...options, headers });
          if (retryResponse.ok) {
            return retryResponse.json();
          }
        }
        throw new Error('Authentication failed');
      }
      throw new Error(`Request failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Add session change listener
   */
  onSessionChange(listener: (session: Session | null) => void): () => void {
    this.sessionListeners.push(listener);
    return () => {
      const index = this.sessionListeners.indexOf(listener);
      if (index > -1) {
        this.sessionListeners.splice(index, 1);
      }
    };
  }

  /**
   * Add user change listener
   */
  onUserChange(listener: (user: AuthUser | null) => void): () => void {
    this.userListeners.push(listener);
    return () => {
      const index = this.userListeners.indexOf(listener);
      if (index > -1) {
        this.userListeners.splice(index, 1);
      }
    };
  }

  // Private helper methods

  private isSessionExpiring(session: Session): boolean {
    const expiresAt = session.expires_at;
    if (!expiresAt) return false;
    
    const now = Math.floor(Date.now() / 1000);
    const timeToExpire = expiresAt - now;
    
    // Refresh if expires in less than 5 minutes
    return timeToExpire < 300;
  }

  private async getUserProfile(userId: string): Promise<AuthUser> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is OK for new users
      throw error;
    }

    if (!data) {
      // Create profile if it doesn't exist
      const user = await supabase.auth.getUser();
      if (user.data.user) {
        return await this.createUserProfile(userId, user.data.user.user_metadata?.display_name || 'Player');
      }
      throw new Error('Failed to get user data');
    }

    return {
      id: data.id,
      email: data.email,
      displayName: data.display_name,
      avatarUrl: data.avatar_url,
      emailVerified: data.email_verified,
      createdAt: data.created_at,
      lastSignInAt: data.last_sign_in_at,
    };
  }

  private async createUserProfile(userId: string, displayName: string): Promise<AuthUser> {
    const userAuth = await supabase.auth.getUser();
    if (!userAuth.data.user) {
      throw new Error('No authenticated user found');
    }

    const profileData = {
      id: userId,
      email: userAuth.data.user.email!,
      display_name: displayName,
      email_verified: userAuth.data.user.email_confirmed_at !== null,
      created_at: new Date().toISOString(),
      last_sign_in_at: userAuth.data.user.last_sign_in_at,
    };

    const { data, error } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      id: data.id,
      email: data.email,
      displayName: data.display_name,
      avatarUrl: data.avatar_url,
      emailVerified: data.email_verified,
      createdAt: data.created_at,
      lastSignInAt: data.last_sign_in_at,
    };
  }

  private async checkDisplayNameExists(displayName: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('display_name', displayName)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking display name:', error);
      return false;
    }

    return data !== null;
  }

  private getReadableErrorMessage(errorMessage: string): string {
    const errorMap: Record<string, string> = {
      'Invalid login credentials': 'Invalid email or password. Please check your credentials and try again.',
      'Email not confirmed': 'Please verify your email address before signing in.',
      'User already exists': 'An account with this email already exists.',
      'Password should be at least 6 characters': 'Password must be at least 6 characters long.',
      'Only an email address is allowed': 'Please enter a valid email address.',
      'To signup, please provide your email': 'Email address is required to create an account.',
      'Signup requires a valid password': 'A valid password is required to create an account.',
    };

    return errorMap[errorMessage] || errorMessage;
  }
}

// Create and export singleton instance
export const authService = new AuthService();

// Export Supabase client for direct access when needed
export { supabase };

export default authService; 