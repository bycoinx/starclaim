import React, {useEffect, useRef} from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const {width, height} = Dimensions.get('window');

function randomInt(max){
  return Math.floor(Math.random()*max);
}

export default function SpaceBackground(){
  const dots = useRef(Array.from({length:60}).map(()=>({
    left: Math.random()*width,
    top: Math.random()*height,
    scale: Math.random()*1.2 + 0.2,
    delay: Math.random()*4000
  }))).current;

  const animVals = useRef(dots.map(()=>new Animated.Value(0))).current;

  useEffect(()=>{
    const animations = animVals.map((v,i)=>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v,{toValue:1,duration:800,useNativeDriver:true,delay:dots[i].delay}),
          Animated.timing(v,{toValue:0.2,duration:1200,useNativeDriver:true})
        ])
      )
    );
    Animated.stagger(50, animations).start();
  },[])

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {dots.map((d,i)=>(
        <Animated.View key={i} style={[styles.dot,{left:d.left,top:d.top,transform:[{scale:d.scale},{translateY:0}] ,opacity:animVals[i]}]} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  dot:{
    position:'absolute',
    width:2,
    height:2,
    borderRadius:1,
    backgroundColor:'#FFFFFF'
  }
})
