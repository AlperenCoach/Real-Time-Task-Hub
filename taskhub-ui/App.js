import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Image, Alert, Modal, ScrollView, Switch, KeyboardAvoidingView, Platform, SafeAreaView, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { getTasks, createTask, updateTask, deleteTask, getTotalCompletedTasks, getTotalCompletedTasksAsync } from './src/api';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');


export default function App() {
  const [tasks, setTasks] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [activeDay, setActiveDay] = useState(null);
  const [currentView, setCurrentView] = useState('home'); // 'home' veya 'myTasks'
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profileView, setProfileView] = useState(null); // 'myProfile', 'login', 'signup', 'settings'
  const [username, setUsername] = useState('User');
  const [profileImage, setProfileImage] = useState(null);
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [allTimeCompletedTasks, setAllTimeCompletedTasks] = useState(0);
  
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Theme colors
  const theme = {
    light: {
      background: '#f5f5f5',
      surface: '#fff',
      text: '#333',
      textSecondary: '#666',
      textTertiary: '#999',
      border: '#e0e0e0',
      primary: '#007AFF',
      success: '#34C759',
      danger: '#ff3b30',
      calendarBg: '#000',
      calendarDay: '#333',
      calendarActive: '#007AFF',
    },
    dark: {
      background: '#000',
      surface: '#1c1c1e',
      text: '#fff',
      textSecondary: '#a1a1a6',
      textTertiary: '#636366',
      border: '#38383a',
      primary: '#0a84ff',
      success: '#30d158',
      danger: '#ff453a',
      calendarBg: '#1c1c1e',
      calendarDay: '#38383a',
      calendarActive: '#0a84ff',
    },
  };

  const colors = isDarkMode ? theme.dark : theme.light;
   /**
    * App
    * main, profile, tasks, task detail
    * 
    * 
    * 
    * 
    * 
    * 
    */
  // Sayfa yüklendiğinde bir kez çalışır
  useEffect(() => {
    fetchData();
    fetchAllTimeCompletedTasks();
  }, []);

  // All-time completed tasks sayısını çek
  const fetchAllTimeCompletedTasks = async () => {
    try {
      const response = await getTotalCompletedTasks();
      console.log("All-time completed tasks full response:", response);
      console.log("All-time completed tasks response.data:", response.data);
      console.log("All-time completed tasks response.status:", response.status);
      
      // Response.data direkt integer olmalı (ASP.NET Core Ok(int) döndürüyor)
      let count = 0;
      if (response && response.data !== undefined && response.data !== null) {
        if (typeof response.data === 'number') {
          count = response.data;
        } else if (typeof response.data === 'object' && response.data.completedallTasks !== undefined) {
          count = response.data.completedallTasks;
        } else {
          // String ise number'a çevir
          count = parseInt(response.data) || 0;
        }
      }
      
      console.log("Parsed count:", count);
      setAllTimeCompletedTasks(count);
    } catch (error) {
      console.error("All-time completed tasks çekilirken hata oluştu:", error);
      console.error("Error details:", error.response?.data || error.message);
      console.error("Error status:", error.response?.status);
      console.error("Error config:", error.config);
      // Hata durumunda 0 göster
      setAllTimeCompletedTasks(0);
    }
  };

  // API'den verileri çeken fonksiyon
  const fetchData = async () => {
    try {
      const response = await getTasks();
      // Backend'den gelen görevlere day field'ı ekle (eğer yoksa)
      const tasksWithDay = response.data.map(task => ({
        ...task,
        day: task.day || null // Backend'de day field'ı yoksa null
      }));
      setTasks(tasksWithDay);
    } catch (error) {
      console.error("Veri çekilirken hata oluştu:", error);
    }
  };

  const handleSubmit = async () => {
    // Gün seçimi kontrolü
    if (!activeDay) {
      Alert.alert("Select a Day", "Please select a day from the calendar first.");
      return;
    }
    
    // Input boş kontrolü
    if (!newTitle.trim()) {
      Alert.alert("Empty Task", "Please enter a task title.");
      return;
    }
    
    try {
      // Görevi day bilgisiyle birlikte gönder
      // id ve createdat backend'de otomatik oluşturulacak
      const newTask = {
        title: newTitle, 
        status: false, // Backend'de status field'ı kullanılıyor
        day: activeDay
      };
      await createTask(newTask);
      setNewTitle('');
      fetchData(); // Listeyi yenile
      // All-time counter'ı güncelle
      await fetchAllTimeCompletedTasks();
    } catch (error) {
      console.error("Görev eklenirken hata oluştu:", error);
      Alert.alert("Error", "Failed to add task. Please try again.");
    }
  };

  // Seçili günün görevlerini filtrele
  const getCurrentDayTasks = () => {
    if (!activeDay) return [];
    return tasks.filter(task => task.day === activeDay);
  };

  // Tüm haftanın görevlerini günlere göre grupla
  const getWeeklyTasks = () => {
    const grouped = {};
    days.forEach(day => {
      grouped[day] = tasks.filter(task => task.day === day);
    });
    return grouped;
  };

  const handleDelete = async (taskId) => {
    if (!taskId) {
      console.error("Task ID is missing");
      Alert.alert("Error", "Task ID is missing. Cannot delete task.");
      return;
    }

    try {
      console.log("Deleting task with ID:", taskId);
      const response = await deleteTask(taskId);
      console.log("Delete response:", response);
      
      // Başarılı silme sonrası listeyi yenile
      await fetchData();
      // All-time counter'ı güncelle (task silinse bile counter değişmez ama güncelle)
      await fetchAllTimeCompletedTasks();
    } catch (error) {
      console.error("Görev silinirken hata oluştu:", error);
      console.error("Error details:", error.response?.data || error.message);
      console.error("Error status:", error.response?.status);
      
      let errorMessage = "Failed to delete task. Please try again.";
      if (error.response?.status === 404) {
        errorMessage = "Task not found. It may have already been deleted.";
        // 404 hatası olsa bile listeyi yenile (task zaten silinmiş olabilir)
        await fetchData();
      } else if (error.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (error.request) {
        errorMessage = "Network error. Please check your connection.";
      }
      
      Alert.alert("Error", errorMessage);
    }
  };

  const handleToggleStatus = async (task) => {
    try {
      const updatedTask = {
        ...task,
        status: !task.status,
      };
      await updateTask(task.id, updatedTask);
      fetchData();
      // All-time counter'ı güncelle (backend otomatik artırıyor)
      await fetchAllTimeCompletedTasks();
    } catch (error) {
      console.error("Görev durumu güncellenirken hata oluştu:", error);
      Alert.alert("Error", "Failed to update task status. Please try again.");
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task.id);
    setEditTitle(task.title);
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      Alert.alert("Empty Task", "Please enter a task title.");
      return;
    }

    try {
      const task = tasks.find(t => t.id === editingTask);
      if (task) {
        const updatedTask = {
          ...task,
          title: editTitle.trim(),
        };
        await updateTask(editingTask, updatedTask);
        setEditingTask(null);
        setEditTitle('');
        fetchData();
        // All-time counter'ı güncelle
        await fetchAllTimeCompletedTasks();
      }
    } catch (error) {
      console.error("Görev güncellenirken hata oluştu:", error);
      Alert.alert("Error", "Failed to update task. Please try again.");
    }
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
    setEditTitle('');
  };

  // Profil menü fonksiyonları
  const getTotalCompletedTasks = () => {
    return getTotalCompletedTasksAsync();
  };


  const handleProfileImagePicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need permission to access your photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleSaveUsername = () => {
    if (newUsername.trim()) {
      setUsername(newUsername.trim());
      setEditingUsername(false);
      setNewUsername('');
    }
  };

  const handleProfileMenuClick = (view) => {
    setShowProfileMenu(false);
    setProfileView(view);
    if (view === 'myProfile') {
      setNewUsername(username);
      // My Profile açıldığında all-time completed tasks sayısını güncelle
      fetchAllTimeCompletedTasks();
    } else if (view === 'login') {
      setEmail('');
      setPassword('');
    } else if (view === 'signup') {
      setSignupEmail('');
      setSignupPassword('');
      setConfirmPassword('');
      setSignupUsername('');
    }
  };

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email.');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password.');
      return;
    }

    try {
      // TODO: Backend API çağrısı yapılacak
      // const response = await loginUser(email, password);
      // Şimdilik mock login
      Alert.alert('Success', 'Login successful!');
      setProfileView(null);
      setEmail('');
      setPassword('');
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Login failed. Please try again.');
    }
  };

  const handleSignup = async () => {
    if (!signupUsername.trim()) {
      Alert.alert('Error', 'Please enter your username.');
      return;
    }
    if (!signupEmail.trim()) {
      Alert.alert('Error', 'Please enter your email.');
      return;
    }
    if (!signupPassword.trim()) {
      Alert.alert('Error', 'Please enter your password.');
      return;
    }
    if (signupPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    if (signupPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long.');
      return;
    }

    try {
      // TODO: Backend API çağrısı yapılacak
      // const response = await signupUser(signupUsername, signupEmail, signupPassword);
      // Şimdilik mock signup
      Alert.alert('Success', 'Account created successfully!');
      setProfileView(null);
      setSignupEmail('');
      setSignupPassword('');
      setConfirmPassword('');
      setSignupUsername('');
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Error', 'Signup failed. Please try again.');
    }
  };

  const renderProfileMenu = () => (
    <Modal
      visible={showProfileMenu}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowProfileMenu(false)}
    >
      <TouchableOpacity
        style={styles.menuOverlay}
        activeOpacity={1}
        onPress={() => setShowProfileMenu(false)}
      >
        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          <View style={styles.profileMenu}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleProfileMenuClick('myProfile')}
            >
              <Ionicons name="person" size={20} color="#333" />
              <Text style={styles.menuItemText}>My Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleProfileMenuClick('login')}
            >
              <Ionicons name="log-in" size={20} color="#333" />
              <Text style={styles.menuItemText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleProfileMenuClick('signup')}
            >
              <Ionicons name="person-add" size={20} color="#333" />
              <Text style={styles.menuItemText}>Signup</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleProfileMenuClick('settings')}
            >
              <Ionicons name="settings" size={20} color="#333" />
              <Text style={styles.menuItemText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  const renderMyProfile = () => (
    <Modal
      visible={profileView === 'myProfile'}
      animationType="slide"
      onRequestClose={() => setProfileView(null)}
    >
      <SafeAreaView style={styles.profileContainer}>
        <View style={styles.profileHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setProfileView(null)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.profileTitle}>My Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView 
          style={styles.profileContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.profileImageContainer}>
            <TouchableOpacity onPress={handleProfileImagePicker}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Ionicons name="person" size={60} color="#999" />
                </View>
              )}
              <View style={styles.editImageIcon}>
                <Ionicons name="camera" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.profileSection}>
            <Text style={styles.sectionLabel}>Username</Text>
            {editingUsername ? (
              <View style={styles.usernameEditContainer}>
                <TextInput
                  style={styles.usernameInput}
                  value={newUsername}
                  onChangeText={setNewUsername}
                  placeholder="Enter username"
                  autoFocus
                />
                <TouchableOpacity onPress={handleSaveUsername} style={styles.saveButton}>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setEditingUsername(false);
                    setNewUsername(username);
                  }}
                  style={styles.cancelButton}
                >
                  <Ionicons name="close" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.usernameDisplayContainer}>
                <Text style={styles.usernameText}>{username}</Text>
                <TouchableOpacity
                  onPress={() => setEditingUsername(true)}
                  style={styles.editButton}
                >
                  <Ionicons name="create" size={18} color="#007AFF" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.profileSection}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>My Total Completed Tasks</Text>
            
            <View style={styles.statsContainer}>
              <Ionicons name="checkmark-circle" size={40} color={colors.success} />
              <Text style={[styles.statsNumber, { color: colors.success }]}>{allTimeCompletedTasks}</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderLogin = () => (
    <Modal
      visible={profileView === 'login'}
      animationType="slide"
      onRequestClose={() => setProfileView(null)}
    >
      <SafeAreaView style={styles.profileContainer}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
        <View style={styles.profileHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setProfileView(null)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.profileTitle}>Login</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView 
          style={styles.authContent} 
          contentContainerStyle={styles.authContentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.authForm}>
            <View style={styles.authHeader}>
              <Ionicons name="log-in" size={60} color="#007AFF" />
              <Text style={styles.authTitle}>Welcome Back</Text>
              <Text style={styles.authSubtitle}>Sign in to continue</Text>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.authInput}
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.authInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor="#999"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity onPress={handleLogin} style={styles.authButton}>
              <Text style={styles.authButtonText}>Login</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.authLink}
              onPress={() => {
                setProfileView('signup');
                setEmail('');
                setPassword('');
              }}
            >
              <Text style={styles.authLinkText}>
                Don't have an account? <Text style={styles.authLinkTextBold}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );

  const renderSignup = () => (
    <Modal
      visible={profileView === 'signup'}
      animationType="slide"
      onRequestClose={() => setProfileView(null)}
    >
      <SafeAreaView style={styles.profileContainer}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
        <View style={styles.profileHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setProfileView(null)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.profileTitle}>Signup</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView 
          style={styles.authContent} 
          contentContainerStyle={styles.authContentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.authForm}>
            <View style={styles.authHeader}>
              <Ionicons name="person-add" size={60} color="#007AFF" />
              <Text style={styles.authTitle}>Create Account</Text>
              <Text style={styles.authSubtitle}>Sign up to get started</Text>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.authInput}
                value={signupUsername}
                onChangeText={setSignupUsername}
                placeholder="Username"
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.authInput}
                value={signupEmail}
                onChangeText={setSignupEmail}
                placeholder="Email"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.authInput}
                value={signupPassword}
                onChangeText={setSignupPassword}
                placeholder="Password"
                placeholderTextColor="#999"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.authInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm Password"
                placeholderTextColor="#999"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity onPress={handleSignup} style={styles.authButton}>
              <Text style={styles.authButtonText}>Sign Up</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.authLink}
              onPress={() => {
                setProfileView('login');
                setSignupEmail('');
                setSignupPassword('');
                setConfirmPassword('');
                setSignupUsername('');
              }}
            >
              <Text style={styles.authLinkText}>
                Already have an account? <Text style={styles.authLinkTextBold}>Login</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal> 
  );

  const renderSettings = () => (
    <Modal
      visible={profileView === 'settings'}
      animationType="slide"
      onRequestClose={() => setProfileView(null)}
    >
      <SafeAreaView style={[styles.profileContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.profileHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setProfileView(null)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.profileTitle, { color: colors.text }]}>Settings</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView 
          style={styles.authContent} 
          contentContainerStyle={styles.authContentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.settingsForm}>
            <View style={[styles.settingItem, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
              <View style={styles.settingItemLeft}>
                <Ionicons 
                  name={isDarkMode ? "moon" : "sunny"} 
                  size={24} 
                  color={colors.text} 
                  style={styles.settingIcon} 
                />
                <View style={styles.settingItemText}>
                  <Text style={[styles.settingItemTitle, { color: colors.text }]}>Dark Mode</Text>
                  <Text style={[styles.settingItemSubtitle, { color: colors.textSecondary }]}>
                    {isDarkMode ? 'Dark theme is enabled' : 'Light theme is enabled'}
                  </Text>
                </View>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={setIsDarkMode}
                trackColor={{ false: '#767577', true: colors.primary }}
                thumbColor={isDarkMode ? '#fff' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderTask = ({ item }) => {
    if (editingTask === item.id) {
      return (
        <View style={[styles.taskItem, { backgroundColor: colors.surface }]}>
          <TextInput
            style={[styles.editInput, { borderColor: colors.primary, color: colors.text, backgroundColor: colors.background }]}
            value={editTitle}
            onChangeText={setEditTitle}
            autoFocus
          />
          <TouchableOpacity onPress={handleSaveEdit} style={styles.iconButton}>
            <Ionicons name="checkmark" size={24} color={colors.success} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCancelEdit} style={styles.iconButton}>
            <Ionicons name="close" size={24} color={colors.danger} />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={[styles.taskItem, { backgroundColor: colors.surface }]}>
        <TouchableOpacity 
          style={styles.taskContent}
          onPress={() => handleToggleStatus(item)}
        >
          {item.status && (
            <Ionicons name="checkmark-circle" size={24} color={colors.success} style={styles.statusIcon} />
          )}
          <Text style={[styles.taskTitle, { color: colors.text }, item.status && { color: colors.textTertiary, textDecorationLine: 'line-through' }]}>
            {item.title}
          </Text>
        </TouchableOpacity>
        <View style={styles.taskActions}>
          <TouchableOpacity onPress={() => handleEdit(item)} style={styles.iconButton}>
            <Ionicons name="create" size={22} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => {
              console.log("Delete button pressed, task ID:", item.id);
              handleDelete(item.id);
            }} 
            style={styles.iconButton}
          >
            <Ionicons name="close-circle" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // My Tasks için günlere göre gruplanmış görevleri render et
  const renderWeeklyTasks = () => {
    const weeklyTasks = getWeeklyTasks();
    return (
      <FlatList
        data={days}
        keyExtractor={(day) => day}
        renderItem={({ item: day }) => {
          const dayTasks = weeklyTasks[day] || [];
          if (dayTasks.length === 0) return null;
          
          return (
            <View style={styles.dayGroup}>
              <Text style={[styles.dayGroupTitle, { color: colors.text }]}>{day}</Text>
              {dayTasks.map((task) => {
                if (editingTask === task.id) {
                  return (
                    <View key={task.id?.toString() || Math.random()} style={[styles.taskItem, { backgroundColor: colors.surface }]}>
                      <TextInput
                        style={[styles.editInput, { borderColor: colors.primary, color: colors.text, backgroundColor: colors.background }]}
                        value={editTitle}
                        onChangeText={setEditTitle}
                        autoFocus
                      />
                      <TouchableOpacity onPress={handleSaveEdit} style={styles.iconButton}>
                        <Ionicons name="checkmark" size={24} color={colors.success} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleCancelEdit} style={styles.iconButton}>
                        <Ionicons name="close" size={24} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  );
                }

                return (
                  <View key={task.id?.toString() || Math.random()} style={[styles.taskItem, { backgroundColor: colors.surface }]}>
                    <TouchableOpacity 
                      style={styles.taskContent}
                      onPress={() => handleToggleStatus(task)}
                    >
                      {task.status && (
                        <Ionicons name="checkmark-circle" size={24} color={colors.success} style={styles.statusIcon} />
                      )}
                      <Text style={[styles.taskTitle, { color: colors.text }, task.status && { color: colors.textTertiary, textDecorationLine: 'line-through' }]}>
                        {task.title}
                      </Text>
                    </TouchableOpacity>
                    <View style={styles.taskActions}>
                      <TouchableOpacity onPress={() => handleEdit(task)} style={styles.iconButton}>
                        <Ionicons name="create" size={22} color={colors.text} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => {
                          console.log("Delete button pressed, task ID:", task.id);
                          handleDelete(task.id);
                        }} 
                        style={styles.iconButton}
                      >
                        <Ionicons name="close-circle" size={22} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
      />
    );
  };

  // Anasayfa görevleri
  const renderHomeTasks = () => {
    const currentDayTasks = getCurrentDayTasks();
    if (!activeDay) {
      return (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>Please select a day from the calendar</Text>
        </View>
      );
    }
    
    if (currentDayTasks.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>No tasks for {activeDay}</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={currentDayTasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      />
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkMode ? "light" : "auto"} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Image source={require('./src/assets/taskhublogo.png')} style={styles.logo} />
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {currentView === 'home' 
              ? `Tasks (${getCurrentDayTasks().length})` 
              : `All Tasks (${tasks.length})`
            }
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowProfileMenu(true)}>
          <Ionicons name="person" size={30} color={colors.text} style={styles.profile} />
        </TouchableOpacity>
      </View>

      <View style={[styles.calendar, { backgroundColor: colors.calendarBg }]}>
        <View style={styles.row}>
          {days.map((day, index) => (
            <TouchableOpacity 
              key={index} 
              onPress={() => {
                setActiveDay(day);
                if (currentView === 'myTasks') {
                  setCurrentView('home');
                }
              }}
              style={[
                styles.daySquare, 
                { backgroundColor: activeDay === day ? colors.calendarActive : colors.calendarDay }
              ]}
            >
              <Text style={[
                styles.dayText, 
                { color: '#fff' }
              ]}>
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.form, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          value={newTitle}
          onChangeText={setNewTitle}
          placeholder={activeDay ? `Add a new task for ${activeDay}` : "Select a day first..."}
          placeholderTextColor={colors.textTertiary}
          editable={!!activeDay}
        />
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary }, !activeDay && styles.buttonDisabled]} 
          onPress={handleSubmit}
          disabled={!activeDay}
        >
          <Text style={styles.buttonText}>Add+</Text>
        </TouchableOpacity>
      </View>

      {currentView === 'home' ? renderHomeTasks() : renderWeeklyTasks()}

      {renderProfileMenu()}
      {renderMyProfile()}
      {renderLogin()}
      {renderSignup()}
      {renderSettings()}

      <View style={[styles.bottombar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.bottombarButton}
          onPress={() => setCurrentView('myTasks')}
          hitSlop={{ top: 10, bottom: 20, left: 10, right: 10 }}
        >
          <Ionicons name="list" size={24} color={currentView === 'myTasks' ? colors.primary : colors.text} />
          <Text style={[styles.bottombarButtonText, { marginLeft: 8, color: colors.text }, currentView === 'myTasks' && { color: colors.primary }]}>My Tasks</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.bottombarButtonCenter, { backgroundColor: colors.background }]}
          onPress={() => setCurrentView('home')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="home" size={28} color={currentView === 'home' ? colors.primary : colors.text} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.bottombarButton}
          onPress={() => setCurrentView('completed')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="checkmark-circle" size={24} color={currentView === 'completed' ? colors.primary : colors.text} />
          <Text style={[styles.bottombarButtonText, { marginLeft: 8, color: colors.text }, currentView === 'completed' && { color: colors.primary }]}>Completed</Text>
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    minHeight: 60,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    marginRight: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },

  calendar: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#000',
    borderBottomWidth: 2,
    borderBottomColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  daySquare: {
    width: Math.min(45, SCREEN_WIDTH / 8),
    height: Math.min(45, SCREEN_WIDTH / 8),
    borderRadius: 8,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
    minHeight: 40,
  },
  activeSquare: {
    backgroundColor: '#007AFF',
  },
  dayText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  activeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  form: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginRight: 10,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 70,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    flex: 1,
    marginBottom: Platform.OS === 'ios' ? 80 : 75, // Bottom bar için boşluk
  },
  listContent: {
    padding: 15,
    paddingBottom: 20,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    minHeight: 56,
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    lineHeight: 22,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  statusIcon: {
    marginRight: 10,
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  profile: {
    // Icon sağda konumlandırıldı
  },
  bottombar: {
    position: 'absolute',
    bottom: -35,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'ios' ? 10 : 12,
    paddingHorizontal: 10,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  bottombarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 8,
    minHeight: 44,
  },
  bottombarButtonCenter: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bottombarButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  bottombarButtonTextActive: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  dayGroup: {
    marginBottom: 20,
  },
  dayGroupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    paddingHorizontal: 15,
  },
  // Profile Menu Styles
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 10,
  },
  profileMenu: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
  // Profile View Styles
  profileContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    minHeight: 60,
  },
  backButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  profileContent: {
    flex: 1,
    padding: 20,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0e0e0',
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editImageIcon: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    backgroundColor: '#007AFF',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  profileSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  sectionSubtext: {
    fontSize: 12,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  usernameDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  usernameText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
  },
  editButton: {
    padding: 5,
  },
  usernameEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  usernameInput: {
    flex: 1,
    height: 45,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  saveButton: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ff3b30',
    borderRadius: 8,
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginTop: 10,
  },
  statsNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#34C759',
  },
  authContent: {
    flex: 1,
  },
  authContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  authForm: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  authTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  authInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  authButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  authButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  authLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  authLinkText: {
    fontSize: 14,
    color: '#666',
  },
  authLinkTextBold: {
    color: '#007AFF',
    fontWeight: '600',
  },
  settingsForm: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 15,
  },
  settingItemText: {
    flex: 1,
  },
  settingItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingItemSubtitle: {
    fontSize: 14,
  },
});
