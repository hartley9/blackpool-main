import * as THREE from '../build/three.module.js';

/*
Converted from Daniel Shiffman's Nature of Code.
Example 6.1 - Seeking a target.


Used for emulating attacking behaviour. Possibly
for use with the vapire squid given the circling 
behaviour...
*/

const getRandomNum = (max = 0 , min = 0) => Math.floor(Math.random() * (max + 1 - min)) + min;

export class SeekingCreature
{
    constructor(x, y, z, scene)
    {
        this.location = new THREE.Vector3(x, y, z);
        this.velocity = new THREE.Vector3();
        this.acceleration = new THREE.Vector3();
        this.r = 3.0;
        this.maxforce = 4;
        this.maxspeed = 0.1;

        //threejs scene
        this.scene = scene;
        
        this.geometry = new THREE.CylinderGeometry(10,15,30,20,10);
        this.geometry.rotateX(THREE.Math.degToRad(90));
        var color = new THREE.Color(`hsl(${getRandomNum(360)}, 100%, 50%)`);
        const material = new THREE.MeshLambertMaterial({
            wireframe: false, 
            color: color,
        });

        this.mesh = new THREE.Mesh( this.geometry, material );
        var pos = new THREE.Vector3(x, y, z);
        this.mesh.position.copy(pos);
        this.scene.add(this.mesh);
        console.log('created seeker');
    }

    //Standard 'Euler integration' motion model
    update(target)
    {
        this.seek(target);
        this.velocity.add(this.acceleration);
        this.velocity.clampLength(0, this.maxspeed);
        this.location.add(this.velocity);

        //update object position
        this.mesh.position.add(this.location);

        //reset acceleration
        this.acceleration.multiply(0);

        const head = this.velocity.clone();
        head.multiplyScalar(10);
        head.add(this.mesh.position);
        this.mesh.lookAt(head);
        
    }
    //newton's second law
    applyForce(force)
    {
        this.acceleration.add(force);
    }

    //seek steering force algorithm
    seek(target)
    {
        var desired = new THREE.Vector3();
        desired.subVectors(target, this.mesh.position);
        desired.normalize();
        desired.multiply(this.maxspeed);
       
       
        var steer = new THREE.Vector3();
        steer.subVectors(desired, this.velocity);
        steer.clampLength(0, this.maxForce);
        this.applyForce(steer);

    }

    display()
    {
        //calculate the heading of the object
        //fill blah blah blah
        //place object at the location
    }

}