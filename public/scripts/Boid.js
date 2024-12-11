import * as THREE from '../build/three.module.js';

/**
 * This class is for each boid to easily change paramets boid-wise and apply behaviours
 * @param {*} creatures - Array of Creatures
 */
export function Boid(creatures = []){
    this.creatures = creatures;
    //Parameters for behaviours
    this.params = {
        maxSpeed: 7.5, 
        walkerThresh: 150,

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
    
        cohesion: {
            effectiveRange: 100,
        },

        avoid: {
            perception: 150,
            maxForce: 0.5,
            boost: 1.75,
        }
        
    };
}

//Called every clock cycle    
Boid.prototype.update = function(bounds, walkers){
    this.creatures.forEach(creature => {
        //boid
        creature.applyForce(this.align(creature));
        creature.applyForce(this.separate(creature));
        creature.applyForce(this.cohesion(creature));
            
        //avoid walkers
        creature.applyForce(this.avoidWalkers(creature, walkers));

        //avoid edge
        
        creature.applyForce(this.avoidBounds(creature, //currentCreature
            (bounds.mesh.geometry.parameters.width / 2), //range width
            (bounds.mesh.geometry.parameters.height / 2), //range height
            bounds.mesh.geometry.parameters.depth / 2)); //range depth


        creature.update();
    });
}

Boid.prototype.seek = function(currentCreature, target = new THREE.Vector3()){
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

Boid.prototype.align = function(currentCreature){
    const sumVector = new THREE.Vector3();
    let cnt = 0;
    const maxSpeed = this.params.maxSpeed;
    const maxForce = this.params.align.maxForce;
    const effectiveRange = this.params.align.effectiveRange;
    const steerVector = new THREE.Vector3();
    
    this.creatures.forEach(creature => {
        const dist = currentCreature.mesh.position.distanceTo(creature.mesh.position);
        if (dist > 0 && dist < effectiveRange) //if within range
        {
            sumVector.add(creature.velocity); //add direction velocity to sum
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

Boid.prototype.separate = function(currentCreature){
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

Boid.prototype.cohesion = function(currentCreature){
    const sumVector = new THREE.Vector3();
    let cnt = 0;
    const effectiveRange = this.params.cohesion.effectiveRange;
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

Boid.prototype.avoid = function(currentCreature, wall = new THREE.Vector3())
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

//Avoid the bounds of the projection
Boid.prototype.avoidBounds = function(currentCreature, 
    rangeWidth = 80, rangeHeight = 80, rangeDepth = 80) 
{
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

Boid.prototype.avoidWalk = function(currentCreature, walker)
{
    currentCreature.mesh.geometry.computeBoundingSphere();
    const boundingSphere = currentCreature.mesh.geometry.boundingSphere;

    walker.plane.geometry.computeBoundingSphere();
    const walkerSphere = walker.plane.geometry.boundingSphere;

    const toMeVector = new THREE.Vector3();
    toMeVector.subVectors(currentCreature.mesh.position, walker.plane.position);

    const distance = toMeVector.length() - ((boundingSphere.radius * 100) + (walkerSphere.radius * 500));
    if ( distance <= this.params.walkerThresh /* || currentCreature.bb.isIntersectionBox(walker.planeBb)*/){
        const steerVector = toMeVector.clone();
        steerVector.normalize();
        steerVector.multiplyScalar(1 / Math.pow(distance, 0.5));
        return steerVector;
    } else{return new THREE.Vector3(0,0,0);}
}

Boid.prototype.avoidWalkers = function(currentCreature, walkers)
{
    
    
    const sumVector = new THREE.Vector3();
   // console.log(walkers);
    for (let i =0; i<walkers[0].length-1; i++){
        console.log(walkers);
        let walker; 
        walkers[i].plane.position.copy(walker);
        sumVector.add(this.avoidWalk(currentCreature, walkers[i]));
    }

    walkers.forEach(w =>  sumVector.add(this.avoidWalk(currentCreature, w)));
    sumVector.multiplyScalar(Math.pow(currentCreature.velocity.length(), 5));
    sumVector.multiplyScalar(this.params.avoid.boost);
    return sumVector;
}
