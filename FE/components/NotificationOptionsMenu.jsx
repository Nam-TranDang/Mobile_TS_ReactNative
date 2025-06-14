import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../constants/colors';

const NotificationOptionsMenu = ({ visible, onClose, onAction }) => {
  const options = [
    { id: 'filter', label: 'Filter notifications', icon: 'filter' },
    { id: 'mark_all_read', label: 'Mark all as read', icon: 'checkmark-done-circle' },
    { id: 'mark_all_unread', label: 'Mark all as unread', icon: 'radio-button-off' },
    { id: 'delete_all', label: 'Delete all notifications', icon: 'trash', danger: true },
  ];
  
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.menuContainer}>
              {options.map(option => (
                <TouchableOpacity 
                  key={option.id}
                  style={styles.menuItem}
                  onPress={() => {
                    onAction(option.id);
                    onClose();
                  }}
                >
                  <Ionicons 
                    name={option.icon} 
                    size={20} 
                    color={option.danger ? COLORS.red : COLORS.textPrimary} 
                  />
                  <Text style={[
                    styles.menuItemText,
                    option.danger && styles.dangerText
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const NotificationItemMenu = ({ visible, onClose, onAction, notification }) => {
  // Determine which read/unread option to show based on the notification's read status
  const getOptions = () => {
    const baseOptions = [];
    
    // Add either Mark as read or Mark as unread based on current read status
    if (notification && notification.read) {
      baseOptions.push({ id: 'mark_unread', label: 'Mark as unread', icon: 'radio-button-off' });
    } else {
      baseOptions.push({ id: 'mark_read', label: 'Mark as read', icon: 'checkmark-circle' });
    }
    
    // Always add delete option
    baseOptions.push({ id: 'delete', label: 'Delete notification', icon: 'trash', danger: true });
    
    return baseOptions;
  };
  
  const options = getOptions();
  
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.menuContainer}>
              {options.map(option => (
                <TouchableOpacity 
                  key={option.id}
                  style={styles.menuItem}
                  onPress={() => {
                    onAction(option.id);
                    onClose();
                  }}
                >
                  <Ionicons 
                    name={option.icon} 
                    size={20} 
                    color={option.danger ? COLORS.red : COLORS.textPrimary} 
                  />
                  <Text style={[
                    styles.menuItemText,
                    option.danger && styles.dangerText
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// Filter options modal
const FilterOptionsModal = ({ visible, onClose, onFilter }) => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  
  const filters = [
    { id: 'all', label: 'All notifications' },
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'week', label: 'This week' },
    { id: 'month', label: 'This month' },
  ];
  
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.filterOverlay}>
          <View style={styles.filterContainer}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filter Notifications</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.filterOptions}>
              {filters.map(filter => (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.filterOption,
                    selectedFilter === filter.id && styles.selectedFilterOption
                  ]}
                  onPress={() => setSelectedFilter(filter.id)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    selectedFilter === filter.id && styles.selectedFilterOptionText
                  ]}>
                    {filter.label}
                  </Text>
                  {selectedFilter === filter.id && (
                    <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity 
              style={styles.applyButton}
              onPress={() => {
                onFilter(selectedFilter);
                onClose();
              }}
            >
              <Text style={styles.applyButtonText}>Apply Filter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuContainer: {
    width: 250,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    margin: 16,
    marginTop: 60,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuItemText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    marginLeft: 12,
  },
  dangerText: {
    color: COLORS.red,
  },
  filterOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  filterContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  filterOptions: {
    marginBottom: 16,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
  },
  selectedFilterOption: {
    backgroundColor: COLORS.border + '50',
  },
  filterOptionText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  selectedFilterOptionText: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  applyButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  applyButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '500',
  },
});

export { NotificationOptionsMenu, NotificationItemMenu, FilterOptionsModal };
