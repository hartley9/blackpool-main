import * as THREE from '../build/three.module.js';
import { GLTFLoader } from '../jsm/loaders/GLTFLoader.js';

let loader = new GLTFLoader;
let mainParams = {
    maxSpeed: 5, 
    seek:{
        maxForce: 0.14
    },

    align: {
        effectiveRange: 85, 
        maxForce: 0.16
    },

    separate: {
        effectiveRange: 70, 
        maxForce: 0.2
    },

    choesin: {
        effectiveRange: 200
    }
};

const getRandomNum = (max = 0 , min = 0) => Math.floor(Math.random() * (max + 1 - min)) + min;

const render = () => {
    boid.update();
    renderer.render(scene, camera);
    requestAnimationFrame(render);
}

export class BoxContainer {
    constructor(width = 100, height = 100, depth = 100, color = 0xffffff) {
      const geometry = new THREE.BoxGeometry(width, height, depth, 10, 10, 10);
      const material = new THREE.MeshLambertMaterial({
        color: color,
        transparent: true,
        opacity: 0.2,
        wireframe: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending });
  
      this.mesh = new THREE.Mesh(geometry, material);
    }
}

export class Boid {
    constructor (creatures = []){
        this.creatures = creatures;
        this.mouse = THREE.Vector3();
        this.params = {
            maxSpeed: 5, 
            seek:{
                maxForce: 0.04
            },
        
            align: {
                effectiveRange: 85, 
                maxForce: 0.16
            },
        
            separate: {
                effectiveRange: 70, 
                maxForce: 0.2
            },
        
            choesin: {
                effectiveRange: 200
            }
        };
    }

    //add mouse as parameter here
    update(boxContainer){
        this.creatures.forEach(creature => {
            //boid
            creature.applyForce(this.align(creature));
            creature.applyForce(this.separate(creature));
            creature.applyForce(this.choesin(creature));

            //avoid light ball

            //avoid edge
            creature.applyForce(this.avoidBoxContainer(creature, boxContainer.mesh.geometry.parameters.width / 2,
                boxContainer.mesh.geometry.parameters.height / 2,
                boxContainer.mesh.geometry.parameters.depth / 2));

            creature.applyForce(this.avoidMouse());

            creature.update();
        });
    }

    setBoost(){
        this.creatures.forEach(creature => {
            if (creature.boost.length() === 0){
                creature.boost.x = getRandomNum(10, -10) * 0.1;
                creature.boost.y = getRandomNum(10, -10) * 0.1;
                creature.boost.z = getRandomNum(10, -10) * 0.1;
                creature.boost.normalize();
                creature.boost.multiplyScalar(this.params.maxSpeed);
            }
        });
    }
    
    seek(currentCreature, target = new THREE.Vector3()){
        const maxSpeed = this.params.maxSpeed;
        const maxForce = this.params.seek.maxForce; 
        const toGoalVector = new THREE.Vector3();
        toGoalVector.subVectors(target, currentCreature.mesh.position);
        const distance = toGoalVector.length();
        toGoalVector.multiplyScalar(maxSpeed);
        const steerVector = new THREE.Vector3();
        steerVector.subVectors(toGoalVector, currentCreature.velocity);
        //limit force
        if (steerVector.length() > maxForce){
            steerVector.clampLength(0, maxForce);
        }
        return steerVector;
    }

    align(currentCreature){
        const sumVector = new THREE.Vector3();
        let cnt = 0;
        const maxSpeed = this.params.maxSpeed;
        const maxForce = this.params.align.maxForce;
        const effectiveRange = this.params.align.effectiveRange;
        const steerVector = new THREE.Vector3();

        this.creatures.forEach(creature => {
            const dist = currentCreature.mesh.position.distanceTo(creature.mesh.position);
            if (dist > 0 && dist < effectiveRange)
            {
                sumVector.add(creature.velocity);
                cnt++;
            }
        });

        if (cnt > 0)
        {
            sumVector.divideScalar(cnt);
            sumVector.normalize();
            sumVector.multiplyScalar(maxSpeed);
        
            steerVector.subVectors(sumVector, currentCreature.velocity);
            //limit force
            if (steerVector.length()>maxForce){
                steerVector.clampLength(0, maxForce);
            }
        }

        return steerVector;
    }

    separate(currentCreature){
        const sumVector = new THREE.Vector3();
        let cnt = 0;
        const maxSpeed = this.params.maxSpeed;
        const maxForce = this.params.separate.maxForce;
        const effectiveRange = this.params.separate.effectiveRange;
        const steerVector = new THREE.Vector3();

        this.creatures.forEach(creature => {
            const dist = currentCreature.mesh.position.distanceTo(creature.mesh.position);
            if (dist > 0 && dist < effectiveRange){
                let toMeVector = new THREE.Vector3();
                toMeVector.subVectors(currentCreature.mesh.position, creature.mesh.position);
                toMeVector.normalize();
                toMeVector.divideScalar(dist);
                sumVector.add(toMeVector);
                cnt++;
            }
        });

        if (cnt > 0){
            sumVector.divideScalar(cnt);
            sumVector.normalize();
            sumVector.multiplyScalar(maxSpeed);

            steerVector.subVectors(sumVector, currentCreature.velocity);

            if (steerVector.length() > maxForce){
                steerVector.clampLength(0, maxForce);
            }
        }
        return steerVector;
    }

    choesin(currentCreature){
        const sumVector = new THREE.Vector3();
        let cnt = 0;
        const effectiveRange = this.params.choesin.effectiveRange;
        const steerVector = new THREE.Vector3();

        this.creatures.forEach(creature => {
            const dist = currentCreature.mesh.position.distanceTo(creature.mesh.position);
            if (dist > 0 && dist < effectiveRange){
                sumVector.add(creature.mesh.position);
                cnt++;
            }
        });

        if (cnt > 0){
            sumVector.divideScalar(cnt);
            steerVector.add(this.seek(currentCreature, sumVector));

        }
        return steerVector;
    }

    avoid(currentCreature, wall = new THREE.Vector3())
    {
        currentCreature.mesh.geometry.computeBoundingSphere();
        const boundingSphere = currentCreature.mesh.geometry.boundingSphere;

        const toMeVector = new THREE.Vector3();
        toMeVector.subVectors(currentCreature.mesh.position, wall);

        const distance = toMeVector.length() - boundingSphere.radius * 2;
        const steerVector = toMeVector.clone();
        steerVector.normalize();
        steerVector.multiplyScalar(1 / Math.pow(distance, 2));
        return steerVector;
    }

    avoidBoxContainer(currentCreature, rangeWidth = 80, rangeHeight = 80, rangeDepth = 80) {
        const sumVector = new THREE.Vector3();
        sumVector.add(this.avoid(currentCreature, new THREE.Vector3(rangeWidth, currentCreature.mesh.position.y, currentCreature.mesh.position.z)));
        sumVector.add(this.avoid(currentCreature, new THREE.Vector3(-rangeWidth, currentCreature.mesh.position.y, currentCreature.mesh.position.z)));
        sumVector.add(this.avoid(currentCreature, new THREE.Vector3(currentCreature.mesh.position.x, rangeHeight, currentCreature.mesh.position.z)));
        sumVector.add(this.avoid(currentCreature, new THREE.Vector3(currentCreature.mesh.position.x, -rangeHeight, currentCreature.mesh.position.z)));
        sumVector.add(this.avoid(currentCreature, new THREE.Vector3(currentCreature.mesh.position.x, currentCreature.mesh.position.y, rangeDepth)));
        sumVector.add(this.avoid(currentCreature, new THREE.Vector3(currentCreature.mesh.position.x, currentCreature.mesh.position.y, -rangeDepth)));
        sumVector.multiplyScalar(Math.pow(currentCreature.velocity.length(), 3));
        return sumVector;
      }

    avoidMouse(currentCreature, vec)
    {
    this.avoid(currentCreature, vec);
    }

    setMouse(mouse)
    {
        this.mouse = mouse;
    }
}

export class Creature {
    constructor(){
        const geometry = new THREE.CylinderGeometry(1,1,1,11);
        //no need to rotate
        geometry.rotateX(THREE.Math.degToRad(90));
        var color = new THREE.Color(`hsl(${getRandomNum(360)}, 100%, 50%)`);
        const material = new THREE.MeshLambertMaterial({
            wireframe: false, 
            color: color
        });

        this.mesh = new THREE.Mesh(geometry, material);
        //const radius = getRandomNum(100, 3000);
        //const theta = THREE.Math.degToRad(getRandomNum(180));
        //const phi = THREE.Math.degToRad(getRandomNum(360));

        //this.mesh.position.x = Math.sin(theta) * Math.cos(phi) * radius;
        //this.mesh.position.y = Math.sin(theta) * Math.sin(phi) * radius;
        //this.mesh.position.z = Math.cos(theta) * radius;

        this.velocity = new THREE.Vector3(getRandomNum(100, -100) * 0.1, getRandomNum(100, -100) * 0.1, getRandomNum(100, -100) * 0.1);
        this.acceleration = new THREE.Vector3();
        this.wonderTheta = 0;
        this.maxSpeed = mainParams.maxSpeed;
        this.boost = new THREE.Vector3();
    }

    applyForce(f){
        this.acceleration.add(f.clone());
    }

    update(){
        const maxSpeed = this.maxSpeed;

        //boost
        this.applyForce(this.boost);
        this.boost.multiplyScalar(0.9);
        if (this.boost.length() < 0.01){
            this.boost = new THREE.Vector3();
        }

        //update vel
        this.velocity.add(this.acceleration);

        //limit
        if (this.velocity.length()>maxSpeed){
            this.velocity.clampLength(0, maxSpeed);
        }

        //update position 
        this.mesh.position.add(this.velocity);

        //reset acceleration
        this.acceleration.multiplyScalar(0);

        //heading
        const head = this.velocity.clone();
        head.multiplyScalar(10);
        head.add(this.mesh.position);
        this.mesh.lookAt(head);

        this.updateColor();
    }

    updateColor()
    {
        let acc = this.acceleration;
        let vel = this.velocity;
        let pos = this.position;
        let fin = new THREE.Vector3();

        fin.add(acc);
        fin.add(vel);
        
        //console.log(fin);
        let col = new THREE.Color(fin.x, fin.y, fin.z);

        this.mesh.material.color = col;
        
    }
}


