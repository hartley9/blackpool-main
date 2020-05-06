import * as THREE from '../build/three.module.js';
let test = 0;
let mainParams = {
    maxSpeed: 5, 
    seek:{
        maxForce: 0.05
    },

    align: {
        effectiveRange: 85, 
        maxForce: 0.06
    },

    separate: {
        effectiveRange: 85, 
        maxForce: 0.2
    },

    choesin: {
        effectiveRange: 200
    }
};

const getRandomNum = (max = 0 , min = 0) => Math.floor(Math.random() * (max + 1 - min)) + min;

//update the predatorLocations in this method
const render = () => {
    boid.update();
    console.log('ha gotya');
    //renderer.render(scene, camera);
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
        this.params = {
            maxSpeed: 5, 
            seek:{
                maxForce: 0.04,
            },
        
            align: {
                effectiveRange: 85, 
                maxForce: 0.16,
            },
        
            separate: {
                effectiveRange: 70, 
                maxForce: 0.2,
            },
        
            choesin: {
                effectiveRange: 200,
            },

            avoid: {
                perception: 150,
                maxForce: 0.5,
            }
        };
    }
    //implment movement away from walkers
    //possibly have a boolean sayign if they will avoid walkers or not
    
    update(boxContainer, walkers){
        this.creatures.forEach(creature => {
            //boid
            creature.applyForce(this.align(creature));
            creature.applyForce(this.separate(creature));
            creature.applyForce(this.choesin(creature));

            creature.applyForce(this.avoidWalkers(creature, walkers));

            //avoid edge
            
            creature.applyForce(this.avoidBoxContainer(creature, //currentCreature
                (boxContainer.mesh.geometry.parameters.width / 2), //range width
                (boxContainer.mesh.geometry.parameters.height / 2), //range height
                boxContainer.mesh.geometry.parameters.depth / 2)); //range depth

            if (test === 0)
            {
                console.log(boxContainer.mesh.geometry.parameters.width / 2); //range width
                console.log(boxContainer.mesh.geometry.parameters.height / 2); //range height
                console.log(boxContainer.mesh.geometry.parameters.depth / 2);
                test = 1;
            }
            

            //avoid walkers
            

            //avoid predators
            //TODO

            creature.update();
        });
    }
    //
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
    //
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

    //
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
    //todo find constants for these divisions
    avoidBoxContainer(currentCreature, rangeWidth = 80, rangeHeight = 80, rangeDepth = 80) {
        const sumVector = new THREE.Vector3();
        sumVector.add(this.avoid(currentCreature, new THREE.Vector3(rangeWidth, currentCreature.mesh.position.y, currentCreature.mesh.position.z)));
        sumVector.add(this.avoid(currentCreature, new THREE.Vector3(-rangeWidth, currentCreature.mesh.position.y, currentCreature.mesh.position.z)));
        sumVector.add(this.avoid(currentCreature, new THREE.Vector3(currentCreature.mesh.position.x, ((rangeHeight/5)), currentCreature.mesh.position.z)));
        sumVector.add(this.avoid(currentCreature, new THREE.Vector3(currentCreature.mesh.position.x, -(rangeHeight+500), currentCreature.mesh.position.z)));
        sumVector.add(this.avoid(currentCreature, new THREE.Vector3(currentCreature.mesh.position.x, currentCreature.mesh.position.y, rangeDepth)));
        sumVector.add(this.avoid(currentCreature, new THREE.Vector3(currentCreature.mesh.position.x, currentCreature.mesh.position.y, -rangeDepth)));
        sumVector.multiplyScalar(Math.pow(currentCreature.velocity.length(), 3.5));
        return sumVector;
      }

    avoidWalk(currentCreature, wall = new THREE.Vector3())
    {
        currentCreature.mesh.geometry.computeBoundingSphere();
        const boundingSphere = currentCreature.mesh.geometry.boundingSphere;

        const toMeVector = new THREE.Vector3();
        toMeVector.subVectors(currentCreature.mesh.position, wall);

        const distance = toMeVector.length() - boundingSphere.radius * 1;
        if (distance <= 50){
            const steerVector = toMeVector.clone();
            steerVector.normalize();
            steerVector.multiplyScalar(1 / Math.pow(distance, 0.75));
            return steerVector;
        } else{return new THREE.Vector3(0,0,0);}
    }

    avoidWalkers(currentCreature, walkers)
    {
       
        const sumVector = new THREE.Vector3();
        for (let i =0; i<walkers[0].length-1; i++){
       //     let walker = walkers.map(function(i){return i[0];});
         //   sumVector.add(this.avoidWalk(currentCreature, new THREE.Vector3(walker[0], walker[1], walker[2])));
          
         console.log(walkers);
         let walker; 
         walkers[i].plane.position.copy(walker);
         sumVector.add(this.avoidWalk(currentCreature, walker));
        }
       
        return sumVector;
    }
}

export class Creature {
    constructor(color, geometry, id){
        this.id = id;
        this.headOut;
       // const geometry = new THREE.CylinderGeometry(1, 8, 25, 12);
        //no need to rotate
       // geometry.rotateX(THREE.Math.degToRad(120));
        var color = new THREE.Color(color);
        const material = new THREE.MeshLambertMaterial({
            wireframe: false, 
            color: color
        });

        this.mesh = new THREE.Mesh(geometry, material);
        //console.log(this.mesh);

        this.velocity = new THREE.Vector3(getRandomNum(100, -100) * 0.1, getRandomNum(100, -100) * 0.1, getRandomNum(100, -100) * 0.1);
        this.acceleration = new THREE.Vector3();
        this.wonderTheta = 0;
        this.maxSpeed = mainParams.maxSpeed;
        this.boost = new THREE.Vector3();

        this.model;
        this.mixer;
        this.action;

        this.defaultRotation = new THREE.Vector3();
        this.rotationOffset = new THREE.Vector3();

        this.upperRotationLimit = [];
        this.lowerRotationLimit = [];
        
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
        //this.headOut = head;


        //update position and rotation of object
        if (this.model !== undefined)
        {
            //change the position

            this.model.scene.children[0].position.x = this.mesh.position.x;
            this.model.scene.children[0].position.y = this.mesh.position.y;
            this.model.scene.children[0].position.z = this.mesh.position.z;
            

            //quaternions
            let quaternion = new THREE.Quaternion();
            let myhead = this.velocity.clone();
            myhead.multiplyScalar(5);
            myhead.add(this.mesh.position);
            this.model.scene.children[0].lookAt(myhead);

            this.model.scene.children[0].rotation.x -= this.defaultRotation.x;
            //head.multiplyScalar(0.5);
           // this.model.scene.children[0].lookAt(0, head.y, head.z);
          //  this.model.scene.children[0].rotation.x = this.defaultRotation.x;
           // this.model.scene.children[0].rotation.z = this.mesh.rotation.x;
        }
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

    setModel(m)
    {
        this.model = m;
        this.defaultRotation = m.scene.children[0].rotation;
       // console.log('default rotation');
       // console.log(this.defaultRotation);
        this.mixer = new THREE.AnimationMixer(this.model.scene);
        this.action = this.mixer.clipAction(this.model.animations[ 0 ]);
        this.action.play();
        
    }

    setScale(s)
    {
        if (this.model !== undefined){

            this.model.scene.children[ 0 ].scale.set(s,s,s);
        }
       
    }

    setRotationOffset(x, y, z)
    {
        this.rotationOffset.x = x;
        this.rotationOffset.y = y;
        this.rotationOffset.z = z;
    }

    setRotationLimit(input, output)
    {
        this.lowerRotationLimit = input; 
        this.upperRotationLimit = output;
    }
}

function convertRange( value, r1, r2 ) { 
    return ( value - r1[ 0 ] ) * ( r2[ 1 ] - r2[ 0 ] ) / ( r1[ 1 ] - r1[ 0 ] ) + r2[ 0 ];
}


