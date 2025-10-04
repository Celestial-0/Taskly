import React from 'react'
import { View } from 'react-native'
import { TaskList } from './task-list'

export const Main = React.memo(function Main() {
  return (
    <View className="flex-1" collapsable={false}>
      <TaskList />
    </View>
  )
})
