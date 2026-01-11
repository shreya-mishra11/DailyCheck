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
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  State,
  Swipeable,
} from 'react-native-gesture-handler';

type Task = {
  id: string;
  title: string;
  createdAt: string;
  completed: boolean;
  isVoiceMemo?: boolean;
};

const STORAGE_KEY = '@tasks_data';
const CANCEL_THRESHOLD = -100;

const defaultTasks: Task[] = [];

const colors = {
  bg: '#FAF6F1',
  surface: '#FFFFFF',
  accent: '#B45309',
  accentLight: '#F3E2C7',
  text: '#1A1A1A',
  textMuted: '#6A6A6A',
  textLight: '#9C9C9C',
  border: '#E7E1D8',
  success: '#356859',
  danger: '#DC2626',
  dangerBg: '#DC2626',
  recordingBg: '#FEF2F2',
};

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [slideOffset, setSlideOffset] = useState(0);
  const [isCancelling, setIsCancelling] = useState(false);
  
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());
  const recordingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const translateX = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const lockSlideAnim = useRef(new Animated.Value(0)).current;
  
  // Empty state animations
  const emptyBounce = useRef(new Animated.Value(0)).current;
  const emptyScale = useRef(new Animated.Value(1)).current;
  const emptyRotate = useRef(new Animated.Value(0)).current;
  const emptyOpacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      saveTasks(tasks);
    }
  }, [tasks, isLoading]);

  // Pulse animation for recording dot
  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      
      // Animate the lock slide hint
      const lockAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(lockSlideAnim, {
            toValue: -8,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(lockSlideAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      lockAnim.start();
      
      return () => {
        pulse.stop();
        lockAnim.stop();
      };
    } else {
      pulseAnim.setValue(1);
      lockSlideAnim.setValue(0);
    }
  }, [isRecording]);

  // Cute empty state animation
  useEffect(() => {
    if (tasks.length === 0 && !isLoading) {
      // Gentle bounce animation
      const bounce = Animated.loop(
        Animated.sequence([
          Animated.timing(emptyBounce, {
            toValue: -12,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(emptyBounce, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      );

      // Subtle scale pulse
      const scale = Animated.loop(
        Animated.sequence([
          Animated.timing(emptyScale, {
            toValue: 1.08,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(emptyScale, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );

      // Gentle wiggle rotation
      const rotate = Animated.loop(
        Animated.sequence([
          Animated.timing(emptyRotate, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(emptyRotate, {
            toValue: -1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(emptyRotate, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );

      // Breathing opacity
      const opacity = Animated.loop(
        Animated.sequence([
          Animated.timing(emptyOpacity, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(emptyOpacity, {
            toValue: 0.5,
            duration: 1800,
            useNativeDriver: true,
          }),
        ])
      );

      bounce.start();
      scale.start();
      rotate.start();
      opacity.start();

      return () => {
        bounce.stop();
        scale.stop();
        rotate.stop();
        opacity.stop();
      };
    }
  }, [tasks.length, isLoading]);

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

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    setIsCancelling(false);

    recordingTimer.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = (cancelled: boolean) => {
    setIsRecording(false);
    setIsCancelling(false);
    
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
      recordingTimer.current = null;
    }

    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start();

    setSlideOffset(0);

    if (!cancelled && recordingTime > 0) {
      const duration = formatRecordingTime(recordingTime);
      const task: Task = {
        id: Date.now().toString(),
        title: `🎤 Voice memo (${duration})`,
        createdAt: new Date().toISOString(),
        completed: false,
        isVoiceMemo: true,
      };
      setTasks(prev => [task, ...prev]);
    }
    
    setRecordingTime(0);
  };

  const onGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    if (!isRecording) return;
    
    const { translationX } = event.nativeEvent;
    const clampedX = Math.min(0, Math.max(translationX, CANCEL_THRESHOLD - 20));
    
    translateX.setValue(clampedX);
    setSlideOffset(clampedX);
    setIsCancelling(clampedX < CANCEL_THRESHOLD);
  };

  const onHandlerStateChange = (event: PanGestureHandlerGestureEvent) => {
    if (event.nativeEvent.state === State.BEGAN) {
      startRecording();
    } else if (
      event.nativeEvent.state === State.END ||
      event.nativeEvent.state === State.CANCELLED
    ) {
      const shouldCancel = slideOffset < CANCEL_THRESHOLD;
      stopRecording(shouldCancel);
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderRightActions = (
    id: string,
    progress: Animated.AnimatedInterpolation<number>
  ) => {
    const animTranslateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [80, 0],
    });

    return (
      <Animated.View style={[styles.deleteContainer, { transform: [{ translateX: animTranslateX }] }]}>
        <Pressable onPress={() => handleDelete(id)} style={styles.deleteButton}>
          <Text style={styles.deleteText}>DELETE</Text>
        </Pressable>
      </Animated.View>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }).toUpperCase();
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar barStyle="dark-content" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerLabel}>TASKS</Text>
          <View style={styles.statsContainer}>
            <Text style={styles.statNumber}>{completedCount}</Text>
            <Text style={styles.statDivider}>/</Text>
            <Text style={styles.statTotal}>{totalCount}</Text>
          </View>
        </View>
        
        <Text style={styles.headerTitle}>What needs{'\n'}to be done?</Text>
        
        <View style={styles.accentBar} />
      </View>

      {/* Input / Recording Row - WhatsApp Style */}
      <View style={styles.inputContainer}>
        <View style={[
          styles.inputRow,
          isRecording && styles.inputRowRecording,
        ]}>
          <View style={[styles.inputAccent, isCancelling && styles.inputAccentDanger]} />
          
          {isRecording ? (
            // Recording UI - replaces text input
            <View style={styles.recordingRow}>
              {/* Cancel zone on left */}
              <View style={styles.cancelSection}>
                {isCancelling ? (
                  <View style={styles.cancelActive}>
                    <Ionicons name="trash" size={20} color={colors.danger} />
                    <Text style={styles.cancelActiveText}>Release to cancel</Text>
                  </View>
                ) : (
                  <Animated.View 
                    style={[
                      styles.slideHint,
                      { transform: [{ translateX: lockSlideAnim }] }
                    ]}
                  >
                    <Ionicons name="chevron-back" size={16} color={colors.textLight} />
                    <Ionicons name="chevron-back" size={16} color={colors.textMuted} style={{ marginLeft: -8 }} />
                    <Text style={styles.slideText}>Slide to cancel</Text>
                  </Animated.View>
                )}
              </View>

              {/* Recording indicator on right */}
              <View style={styles.recordingIndicator}>
                <Animated.View 
                  style={[
                    styles.recordingDot,
                    { opacity: pulseAnim }
                  ]} 
                />
                <Text style={styles.recordingTime}>
                  {formatRecordingTime(recordingTime)}
                </Text>
              </View>
            </View>
          ) : (
            // Normal text input
            <>
              <TextInput
                style={styles.input}
                placeholder="Add a task..."
                placeholderTextColor={colors.textLight}
                value={newTask}
                onChangeText={setNewTask}
                onSubmitEditing={handleAdd}
                returnKeyType="done"
              />
              {newTask.length > 0 && (
                <Pressable onPress={handleAdd} style={styles.addButton}>
                  <Ionicons name="arrow-forward" size={20} color={colors.bg} />
                </Pressable>
              )}
            </>
          )}

          {/* Mic button - always visible, slides with gesture */}
          <PanGestureHandler
            onGestureEvent={onGestureEvent}
            onHandlerStateChange={onHandlerStateChange}
          >
            <Animated.View
              style={[
                styles.micButton,
                isRecording && styles.micButtonRecording,
                isCancelling && styles.micButtonCancelling,
                {
                  transform: [{ translateX }],
                },
              ]}
            >
              <Ionicons 
                name={isRecording ? "mic" : "mic-outline"} 
                size={22} 
                color={isRecording ? "#FFFFFF" : colors.accent} 
              />
            </Animated.View>
          </PanGestureHandler>
        </View>
        
        {!isRecording && (
          <Text style={styles.micHint}>Hold mic to record voice memo</Text>
        )}
      </View>

      {/* Task List */}
      {tasks.length === 0 ? (
        <View style={styles.emptyState}>
          <Animated.View
            style={[
              styles.emptyCircle,
              {
                transform: [
                  { translateY: emptyBounce },
                  { scale: emptyScale },
                  { rotate: emptyRotate.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: ['-5deg', '0deg', '5deg'],
                  })},
                ],
                opacity: emptyOpacity,
              },
            ]}
          >
            <Animated.View style={styles.emptyInnerCircle}>
              <Ionicons name="sparkles-outline" size={32} color={colors.accent} />
            </Animated.View>
          </Animated.View>
          <Text style={styles.emptyTitle}>Nothing here yet</Text>
          <Text style={styles.emptySubtitle}>Add a task above to get started</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
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
                <Text style={styles.taskIndex}>
                  {String(index + 1).padStart(2, '0')}
                </Text>
                
                <View style={styles.taskContent}>
                  <Text style={[styles.taskTitle, item.completed && styles.taskTitleCompleted]}>
                    {item.title}
                  </Text>
                  <Text style={styles.taskMeta}>{formatDate(item.createdAt)}</Text>
                </View>

                <View style={[styles.checkbox, item.completed && styles.checkboxCompleted]}>
                  {item.completed && (
                    <Ionicons name="checkmark" size={14} color={colors.bg} />
                  )}
                </View>
              </Pressable>
            </Swipeable>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>← SWIPE TO DELETE</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMuted,
    letterSpacing: 2,
  },

  // Header
  header: {
    paddingTop: 70,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
    letterSpacing: 3,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '300',
    color: colors.accent,
  },
  statDivider: {
    fontSize: 24,
    fontWeight: '200',
    color: colors.textLight,
    marginHorizontal: 4,
  },
  statTotal: {
    fontSize: 18,
    fontWeight: '400',
    color: colors.textLight,
  },
  headerTitle: {
    fontSize: 42,
    fontWeight: '300',
    color: colors.text,
    lineHeight: 48,
    letterSpacing: -1,
  },
  accentBar: {
    width: 48,
    height: 4,
    backgroundColor: colors.accent,
    marginTop: 24,
  },

  // Input
  inputContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 60,
  },
  inputRowRecording: {
    backgroundColor: colors.recordingBg,
    borderColor: colors.danger,
  },
  inputAccent: {
    width: 4,
    height: '100%',
    backgroundColor: colors.accent,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  inputAccentDanger: {
    backgroundColor: colors.danger,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 18,
    paddingHorizontal: 16,
    paddingLeft: 16,
  },
  addButton: {
    backgroundColor: colors.accent,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: colors.accentLight,
  },
  micButtonRecording: {
    backgroundColor: colors.danger,
  },
  micButtonCancelling: {
    backgroundColor: colors.textLight,
  },
  micHint: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 8,
    textAlign: 'right',
  },

  // Recording UI (inside input row)
  recordingRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  cancelSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slideHint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slideText: {
    fontSize: 14,
    color: colors.textMuted,
    marginLeft: 4,
  },
  cancelActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelActiveText: {
    fontSize: 14,
    color: colors.danger,
    fontWeight: '500',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.danger,
  },
  recordingTime: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },

  // List
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: colors.bg,
  },
  taskRowCompleted: {
    opacity: 0.5,
  },
  taskIndex: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textLight,
    width: 28,
    letterSpacing: 1,
  },
  taskContent: {
    flex: 1,
    marginRight: 16,
  },
  taskTitle: {
    fontSize: 17,
    fontWeight: '400',
    color: colors.text,
    marginBottom: 4,
    lineHeight: 24,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  taskMeta: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textLight,
    letterSpacing: 1,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },

  // Delete
  deleteContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  deleteButton: {
    backgroundColor: colors.dangerBg,
    paddingHorizontal: 20,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },

  // Empty
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 3,
    borderColor: colors.accent,
    borderStyle: 'dashed',
  },
  emptyInnerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '300',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textLight,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 24,
  },
  footerText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textLight,
    letterSpacing: 2,
  },
});
