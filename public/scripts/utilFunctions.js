export function sdpParse(sdp)
{
    console.log(sdp);
    let sdpJson = sdp.toJSON();
    console.log(sdpJson.sdp);

    let split = sdpJson.sdp.split(/\r?\n/);
    let count = 0;
    let found = false;
    while (found ===false)
    {
        let str = split[count];
        if (str.charAt(0) === 'm'){
            break;
        }
        count++;
    }
   
    let videoLine = split[count];
    console.log(videoLine);
    
    let parsedSDP = "";

    //alter this string to set default video codec for connection
    split[count] = "m=video 9 UDP/TLS/RTP/SAVPF 98 102 96 97 99 100 101 122 127 121 125 107 108 109 124 120 123";

    let s;
    for (let i=0; i<split.length; i++)
    {
        if (i === split.length-2)
        {
            s = split[i];
        } else{
            s = split[i] + '\n';
        }
        parsedSDP += s;
    }
    //Create dict to be passed into RTCSessionDescription() constructor
    let sdpDict = {
        type: sdp.type,
        sdp: parsedSDP,
    };
    return sdpDict;
}

export function getRandomNum(min, max) {
    return Math.random() * (max - min) + min;
    }

export function dumpObject(obj, lines = [], isLast = true, prefix = '') {
    const localPrefix = isLast ? '└─' : '├─';
    lines.push(`${prefix}${prefix ? localPrefix : ''}${obj.name || '*no-name*'} [${obj.type}]`);
    const newPrefix = prefix + (isLast ? '  ' : '│ ');
    const lastNdx = obj.children.length - 1;
    obj.children.forEach((child, ndx) => {
        const isLast = ndx === lastNdx;
        dumpObject(child, lines, isLast, newPrefix);
    });
    return lines;
}
    