import * as THREE from '../build/three.module.js';
export class Walker
{
    constructor(id, width, height, scene)
    {
        this.x = this.getRandomArbitrary(-(width/2), width/2), 
        this.y = 10, 
        this.z = this.getRandomArbitrary(-(height/2), height/2);
        
        this.id = id; // give it an ID 

        this.width = width, 
        this.height = height;

        this.geometry, 
        this.material, 
        this.plane;

        this.spline;
        this.ind = 0;

        this.scene = scene;

        this.store;

        this.create();
        this.makeCurve();
    }

    create()
    {
        this.geometry = new THREE.BoxGeometry(35,35,500);
        this.material = new THREE.MeshBasicMaterial({
            color: 0xffff00, 
            side: THREE.DoubleSide
        });
        this.plane = new THREE.Mesh( this.geometry, this.material );

        
        let pos = new THREE.Vector3(this.x, this.y, this.z);
        this.plane.position.copy(pos);
        this.plane.rotation.x = Math.PI * - 0.5;
        this.scene.add(this.plane);
        
        
    }

    getRandomArbitrary(min, max) {
        let r = Math.random() * (max - min) + min;
        return r;
        }

    makeCurve()
    {
        var randomPoints = [];
        for (let i = 0; i<100; i++){
           randomPoints.push(
            new THREE.Vector3(
                this.getRandomArbitrary(-(this.width/2), this.width/2),
                10,
                this.getRandomArbitrary(-(this.height/2), this.height/2))
           );
           
           this.spline = new THREE.SplineCurve3(randomPoints);
        }
        
    }
    moveAlongCurve()
    {
        this.ind ++;
        let curvePos = this.spline.getPoint(this.ind/50000);
        this.plane.position.copy(curvePos);
        if (this.ind > 10000)
        {
            this.ind = 0;
        }
    }
    
    move(amt)
    {
        this.x += this.getRandomArbitrary(-(amt), amt);
        this.z += this.getRandomArbitrary(-(amt), amt);

        this.plane.position.x = this.x;
        this.plane.position.z = this.z;

        this.updateStore();

                /*
        if (this.x >= this.width/2)
        {
            this.x = -(this.width/2);
        } 
        else if (this.x <= -(this.width/2))
        {
            this.x = this.width/2;
        }
        else if(this.z >= this.height/2)
        {
            this.z = -(this.height/2);
        } 
        else if (this.z <= -(this.height/2))
        {
            this.z = this.height/2;
        }
        */

    }

    getBoundingSphere()
    {
        this.plane.geometry.computeBoundingSphere();
        return this.plane.geometry.boundingSphere;
    }

    setStore(s)
    {
        this.store = s;
    }

    // returns array with [id, x,y,z]
    getCoords()
    {
        let coords = [];
        coords.push(this.id);
        coords.push(this.plane.position.x);
        coords.push(this.plane.position.y);
        coords.push(this.plane.position.z);
        return coords;
    }
}