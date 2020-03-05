/*
Converted from Daniel Shiffman's Nature of Code.
Example 6.1 - Seeking a target.


Used for emulating attacking behaviour. Possibly
for use with the vapire squid given the circling 
behaviour...
*/

export class SeekingCreature
{
    constructor(x, y, z)
    {
        this.location = new THREE.Vector3(x, y, z);
        this.velocity = new THREE.Vector3();
        this.acceleration = new THREE.Vector3();
        this.r = 3.0;
        this.maxforce = 4;
        this.maxspeed = 0.1;
    }

    //Standard 'Euler integration' motion model
    update()
    {
        this.velocity.add(this.acceleration);
        this.velocity.clamp(this.maxspeed);
        this.location.add(velocity);
        this.acceleration.multiply(0);
        
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
        desired.subVectors(target, this.location);#
        desired.normalize();
        desired.multiply(this.maxspeed);
        var steer = new THREE.Vector3();
        steer.subVectors(desired, this.velocity);
        steer.clamp(maxForce);
        this.applyForce(steer);

    }

    display()
    {
        //calculate the heading of the object
        //fill blah blah bhah
        //place object at the location

    }

}