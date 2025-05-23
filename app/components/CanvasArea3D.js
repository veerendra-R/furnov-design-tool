'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import styles from './CanvasArea.module.scss';

export default function CanvasArea3D({ walls }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe6e6e6);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);

    
    
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.minDistance = 5;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI / 2; // Prevent flipping below ground
    const light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.position.set(10, 20, 10);
    scene.add(light);

    const allPoints = walls.flatMap(({ start, end }) => [start, end]);
    const minX = Math.min(...allPoints.map(p => p.x));
    const maxX = Math.max(...allPoints.map(p => p.x));
    const minY = Math.min(...allPoints.map(p => p.y));
    const maxY = Math.max(...allPoints.map(p => p.y));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const contentWidth = (maxX - minX) / 20;
    const contentDepth = (maxY - minY) / 20;
    const maxDimension = Math.max(contentWidth, contentDepth);
    

    const floorPadding = 4; // Extra space around the content
    const floorWidth = contentWidth + floorPadding;
    const floorDepth = contentDepth + floorPadding;

    const grid = new THREE.GridHelper(
      Math.max(floorWidth, floorDepth),
      Math.max(floorWidth, floorDepth)
    );
    grid.position.y = 0.01; // slightly above the floor
    scene.add(grid);
    
    const cameraDistance = maxDimension + 10;

    camera.position.set(cameraDistance, cameraDistance, cameraDistance);
    camera.lookAt(0, 0, 0);
    
    controls.target.set(0, 0, 0);
    controls.update();




    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1));

    // Wall Mesh (semi-transparent)
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      transparent: true,
      opacity: 0.6
    });
    const wallHeight = 2.5;



    // Ground Plane
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(floorWidth, floorDepth),
      new THREE.MeshStandardMaterial({ color: 0xf0f0f0 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);    

    // Recentering wall positions (instead of using screen size)
    const xOffset = -25; // shift X and Z to center around origin
    const zOffset = -25;


    walls.forEach(({ start, end, type = 'wall' }) => {
      const dx = (end.x - start.x) / 20;
      const dz = (end.y - start.y) / 20;
      const length = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dz, dx);
    
      // Wall type-specific height and material
      let height = 2.5;
      let material;
    
      if (type === 'door') {
        height = 1.2;
        material = new THREE.MeshStandardMaterial({ color: 0x8b4513 }); // brown
      } else if (type === 'window') {
        height = 1.2;
        material = new THREE.MeshStandardMaterial({
          color: 0x87ceeb,
          transparent: true,
          opacity: 0.5
        });
      } else {
        material = new THREE.MeshStandardMaterial({
          color: 0x666666,
          transparent: true,
          opacity: 0.7
        });
      }
    
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(length, height, 0.1),
        material
      );
    
      wall.position.set(
        ((start.x + end.x) / 2 - centerX) / 20,
        height / 2,
        -((start.y + end.y) / 2 - centerY) / 20
      );
    
      wall.rotation.y = -angle;
      scene.add(wall);
    });
    

    const animate = () => {
      requestAnimationFrame(animate);
      controls.target.set(0, 0, 0);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', resize);

    return () => {
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      window.removeEventListener('resize', resize);
    };
  }, [walls]);

  return <div ref={containerRef} className={styles.canvasContainer} />;
}
