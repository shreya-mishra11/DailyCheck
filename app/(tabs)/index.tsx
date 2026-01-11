import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

type Task = {
  id: string;
  title: string;
  createdAt: string;
  completed: boolean;
};

const STORAGE_KEY = '@tasks_data';

const defaultTasks: Task[] = [
  { id: '1', title: 'Review project requirements', createdAt: new Date().toISOString(), completed: false },
  { id: '2', title: 'Set up development environment', createdAt: new Date().toISOString(), completed: true },
  { id: '3', title: 'Design user interface mockups', createdAt: new Date().toISOString(), completed: false },
];

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());

  // Load tasks from storage on mount
  useEffect(() => {
    loadTasks();
  }, []);

  // Save tasks to storage whenever they change
  useEffect(() => {
    if (!isLoading) {
      saveTasks(tasks);
    }
  }, [tasks, isLoading]);

  const loadTasks = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setTasks(JSON.parse(stored));
      } else {
        setTasks(defaultTasks);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
      setTasks(defaultTasks);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTasks = async (tasksToSave: Task[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasksToSave));
    } catch (error) {
      console.error('Failed to save tasks:', error);
    }
  };

  const handleDelete = (id: string) => {
    swipeableRefs.current.get(id)?.close();
    setTasks(prev => prev.filter(item => item.id !== id));
  };

  const handleToggle = (id: string) => {
    setTasks(prev =>
      prev.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleAdd = () => {
    if (newTask.trim()) {
      const task: Task = {
        id: Date.now().toString(),
        title: newTask.trim(),
        createdAt: new Date().toISOString(),
        completed: false,
      };
      setTasks(prev => [task, ...prev]);
      setNewTask('');
    }
  };

  const renderRightActions = (
    id: string,
    progress: Animated.AnimatedInterpolation<number>
  ) => {
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [100, 0],
    });

    return (
      <Animated.View style={[styles.deleteContainer, { transform: [{ translateX }] }]}>
        <Pressable
          onPress={() => handleDelete(id)}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={22} color="#fff" />
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      </Animated.View>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const pendingCount = tasks.length - completedCount;

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar barStyle="dark-content" />
        <Ionicons name="hourglass-outline" size={48} color="#6366f1" />
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>My Tasks</Text>
          <Text style={styles.subtitle}>
            {pendingCount} pending · {completedCount} completed
          </Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="checkmark-done-circle" size={48} color="rgba(255,255,255,0.3)" />
        </View>
      </View>

      {/* Add Task Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <Ionicons name="add-circle-outline" size={24} color="#6366f1" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Add a new task..."
            placeholderTextColor="#94a3b8"
            value={newTask}
            onChangeText={setNewTask}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
          />
          {newTask.length > 0 && (
            <Pressable onPress={handleAdd} style={styles.addButton}>
              <Ionicons name="arrow-up-circle" size={32} color="#6366f1" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Task List */}
      {tasks.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-done-circle-outline" size={80} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>All done!</Text>
          <Text style={styles.emptySubtitle}>Add a new task to get started</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Swipeable
              ref={ref => {
                if (ref) swipeableRefs.current.set(item.id, ref);
              }}
              renderRightActions={(progress) => renderRightActions(item.id, progress)}
              rightThreshold={40}
              friction={2}
              overshootRight={false}
            >
              <Pressable
                onPress={() => handleToggle(item.id)}
                style={[styles.taskRow, item.completed && styles.taskRowCompleted]}
              >
                <View style={[styles.checkbox, item.completed && styles.checkboxCompleted]}>
                  {item.completed && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </View>
                <View style={styles.taskContent}>
                  <Text style={[styles.taskTitle, item.completed && styles.taskTitleCompleted]}>
                    {item.title}
                  </Text>
                  <Text style={styles.taskMeta}>
                    <Ionicons name="time-outline" size={12} color="#94a3b8" />
                    {' '}{formatDate(item.createdAt)}
                  </Text>
                </View>
                <Ionicons name="chevron-back" size={20} color="#cbd5e1" />
              </Pressable>
            </Swipeable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    backgroundColor: '#6366f1',
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerIcon: {
    marginLeft: 16,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    fontWeight: '500',
  },
  inputContainer: {
    paddingHorizontal: 20,
    marginTop: -20,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    paddingVertical: 16,
  },
  addButton: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 18,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  taskRowCompleted: {
    backgroundColor: '#f1f5f9',
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  taskMeta: {
    fontSize: 12,
    color: '#94a3b8',
  },
  deleteContainer: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    height: '100%',
    borderRadius: 16,
    flexDirection: 'column',
    gap: 4,
  },
  deleteText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#94a3b8',
    marginTop: 8,
  },
});

