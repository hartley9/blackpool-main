import * as THREE from '../build/three.module.js';

export function Store()
{
    this.x = [];
    this.y = [];
    this.z = [];
}

Store.prototype.setValue = function(ind, x, y, z)
{
    this.x[ind] = x;
    this.y[ind] = y;
    this.z[ind] = z;
}

Store.prototype.returnValue = function(ind)
{
    let result;
    result.push(this.x[ind]);
    result.push(this.y[ind]);
    result.push(this.z[ind]);
    return result;
}

Store.prototype.takeVector = function(ind, vec)
{
    this.setValue(ind, vec.x, vec.y, vec.z);
}

Store.prototype.returnVector = function(ind)
{
    return new THREE.Vector3(this.x[ind], this.y[ind], this.z[ind]);
}

Store.prototype.showStore = function()
{
    console.log(this.x);
    console.log(this.y);
    console.log(this.z);

}

Store.prototype.getAll = function()
{
    let all = [];
    all[0] = this.x;
    all[1] = this.y;
    all[2] = this.z;
    return all;
}