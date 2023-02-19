/**
 opencv的函数
 例子：

 */
const path = require('path')
const _ = require('lodash')
const _windows = (process.platform === 'win32');
const cv = _windows ? null : require('opencv')

module.exports = {
    /**
     * 直线拟合公式扩展函数。根据多个点返回
     * @param {array} points 数据点集合
     * @param {double} reps 径向的精度参数  表示直线到原点距离的精度，建议取 0.01。设为0，则自动选用最优值
     * @param {double} aeps 角度精度参数  表示直线角度的精度，建议取 0.01
     * @returns {array} [vx, vy, x0, y0]
     */
    fitline: function (points) {
        if (!_.isArray(points)) return null
        let n = points.length;
        if (n == 0) return null;
        let vx = 1000, vy = 1000, x0 = 0, y0 = 0;
        let x_sum = 0, y_sum = 0, xx_sum = 0, xy_sum = 0;
        for (let i = 0; i < n; i++) {
            vx = Math.min(vx, points[i].x);
            vy = Math.min(vy, points[i].y);
            x0 = Math.max(x0, points[i].x);
            y0 = Math.max(y0, points[i].y);
            x_sum += points[i].x; //x的累加和
            y_sum += points[i].y; //y的累加和
            xx_sum += points[i].x * points[i].x; //x的平方累加和
            xy_sum += points[i].x * points[i].y; //x，y的累加和
        }
        let k = (n * xy_sum - x_sum * y_sum) / (n * xx_sum - x_sum * x_sum); //根据公式求解k
        let b = (-x_sum * xy_sum + xx_sum * y_sum) / (n * xx_sum - x_sum * x_sum);//根据公式求解b
        return [vx, parseInt(k * vx + b), parseInt((y0 - b) / k), y0];
    },
    /**
     * 人脸识别
     * @param {string|buffer} image 图片文件流或者文件路径
     * @returns {Promise<object>} json脸数据[{x = 0, y = 0, width = 100, height = 100}]
     */
    faceDetect: function (image) {
        return new Promise((resolve, reject) => {
            //读取图片
            cv.readImage(image, function (err, im) {
                if (err) {
                    reject(err)
                    return
                }
                let width = im.width();
                let height = im.height();
                if (width < 1 || height < 1) throw new Error('图片大小不正确！');
                //转换图像灰度图像
                im.convertGrayscale()
                //目标检测函数
                im.detectObject(cv.FACE_CASCADE, {}, function (err, faces) {
                    im.release();
                    if (err) {
                        reject(err)
                        return
                    }
                    /*for (let i=0;i<faces.length; i++){
                        let x = faces[i]
                        im.ellipse(x.x + x.width/2, x.y + x.height/2, x.width/2, x.height/2);
                    }
                    im.save(outfile);*/
                    resolve(faces)
                });
            })
        })
    },
    /**
     * 人体识别
     * @param {string|buffer} image 图片文件流或者文件路径
     * @returns {Promise<unknown>}
     */
    bodyDetect: function (image) {
        return new Promise((resolve, reject) => {
            cv.readImage(image, function (err, im) {
                if (err) {
                    reject(err)
                    return
                }
                let width = im.width();
                let height = im.height();
                if (width < 1 || height < 1) throw new Error('图片大小不正确！');
                //转换图像灰度图像
                im.convertGrayscale()
                //im.cvtColor('CV_BGR2GRAY');
                let classifier = new cv.CascadeClassifier(cv.FULLBODY_CASCADE);
                //path.resolve(__dirname, "../../node_modules/opencv/data/haarcascade_lowerbody.xml")
                classifier.detectMultiScale(im, function (err, body) {
                        im.release();
                        if (err) {
                            reject(err)
                            return
                        }
                        /*for (let i = 0; i < body.length; i++) {
                            let x = body[i]
                            im.rectangle([x.x, x.y], [x.width, x.height]);
                        }
                        im.save(path.join(__dirname, "../../out.jpg"));*/
                        resolve(body)
                    },
                    1.05,//scale参数可以具体控制金字塔的层数，参数越小，层数越多，检测时间也长。 一下分别是1.01  1.5 1.03 时检测到的目标。 通常scale在1.01-1.5这个区间
                    3,//表示构成检测目标的相邻矩形的最小个数(默认为3个)
                    [60, 60]//用来限制得到的目标区域的范围
                );
            })
        })
    },
    /**
     * 颜色识别
     * @param {string|buffer} image 图片流或者图片路径
     * @param {object} option 选项
     *  {array [B,G,R]} lowerb 例如：黄色[27, 160, 215]// (B)lue, (G)reen, (R)ed 颜色范围下边界(颜色深的);
     *  {array [B,G,R]} upperb 例如：黄色[83, 255, 255]// (B)lue, (G)reen, (R)ed 颜色范围上边界(颜色浅的);
     * @returns {Promise<unknown>} 返回rect数组
     */
    readColor: function (image, option) {
        option = _.extend(option, {
            //颜色范围下边界(颜色深的);
            lowerb: [27, 160, 215],
            //颜色范围上边界(颜色浅的);
            upperb: [83, 255, 255],
            //检测最小面积
            minArea: 20,
            //检测最大面积
            maxArea: 250000
        })
        return new Promise((resolve, reject) => {
            let result = []
            cv.readImage(image, function (err, im) {
                if (err) {
                    reject(err)
                    return
                }
                let width = im.width();
                let height = im.height();
                if (width < 1 || height < 1) throw new Error('图片大小不正确！');
                //hue色度，saturation饱和度，value纯度
                //如果需要使用HSV的格式需要添加下面这一句
                //im.cvtColor('CV_BGR2HSV')
                im.inRange(option.lowerb, option.upperb)
                let rect = null
                let area = null
                //计算图片的轮廓
                let contours = im.findContours()
                for (let i = 0; i < contours.size(); i++) {
                    let temparea = contours.area(i);
                    if (temparea < option.minArea || temparea > option.maxArea) continue;
                    //把最大的颜色范围显示出来
                    if (area == null || area < temparea) {
                        area = temparea
                        rect = contours.boundingRect(i)
                    }
                    //im.rectangle([rect.x, rect.y], [rect.width, rect.height], [0, 255, 0], 3);
                }
                im.release();
                if (rect != null)
                    result.push(rect)
                //im.save(path.join(__dirname, "../../out.jpg"))
                resolve(result)
            })
        })
    },
    /**
     * 汽车导航
     * @param {string|buffer} image 图片
     * @param {object} option 参数
     */
    carNavigation: function (image, option) {
        option = _.extend(option, {
            //
            lowThresh: 150,
            //
            highThresh: 300,
            //检测最小面积
            minArea: 100,
            //检测最大面积
            maxArea: 250000,
            //最小的周长
            minArcLength: 5,
            //角度最小值
            minAngle: 20,
            //角度最大值
            maxAngle: 84
        })
        let obj = this;

        //过滤函数去除一些小的路线
        function filter(contours, pos, height) {
            //判断面积最小值
            let temparea = contours.area(pos);
            if (temparea < option.minArea || temparea > option.maxArea) return false;
            //判断周长最小值
            let arcLength = contours.arcLength(pos, true);
            if (arcLength < option.minArcLength) return false;
            //判断得到矩形范围
            let rect = contours.boundingRect(pos);
            if (rect.y > height) return false;
            //判断得到最小的矩形范围
            let rrt = contours.minAreaRect(pos);
            //判断得到角度
            let angle = Math.abs(rrt.angle);
            if (angle < option.minAngle || angle > option.maxAngle) return false;
            if (70.0 < angle && angle < 110.0) return false;
            //判断
            if (contours.points(pos).length < 5) return false;
            return true;
        }

        //画出合适的路线
        function fitLines(image) {
            let width = image.width();
            let height = image.height();
            let out = cv.Matrix.Zeros(height, width, image.type());
            //中心点坐标
            let cx = parseInt(width / 2);
            let cy = parseInt(height / 2);
            let left_pts = [];
            let right_pts = [];
            let left;
            //直线的坐标
            let x1;
            let y1;
            let x2;
            let y2;
            for (let i = 100; i < (cx - 10); i++) {
                for (let j = cy; j < height; j++) {
                    //得到点的坐标颜色
                    let pv = image.get(j, i);
                    if (pv == 255) {
                        left_pts.push({x: i, y: j});
                    }
                }
            }
            for (let i = cx; i < (width - 20); i++) {
                for (let j = cy; j < height; j++) {
                    //得到点的坐标颜色
                    let pv = image.get(j, i);
                    if (pv == 255) {
                        right_pts.push({x: i, y: j});
                    }
                }
            }
            if (left_pts.length != 0) {
                if (left_pts.length > 2) {
                    left = obj.fitline(left_pts);
                    let k1 = left[1] / left[0];
                    let step = left[3] - k1 * left[2];
                    x1 = parseInt((height - step) / k1);
                    y1 = height;
                    x2 = parseInt(cx - 25);
                    y2 = parseInt((cx - 25) * k1 + step);
                } else {
                    x1 = left_pts[0].x;
                    y1 = left_pts[0].y;
                    x2 = left_pts[1].x;
                    y2 = left_pts[1].y;
                }
                out.line([x1, y1], [x2, y2], [255, 255, 255]);
                out.save(path.join(__dirname, "../../imgout1.jpg"));
            }

            if (right_pts.length != 0) {
                if (right_pts.length > 2) {
                    x1 = right_pts[0].x;
                    y1 = right_pts[0].y;
                    x2 = right_pts[right_pts.length - 1].x;
                    y2 = right_pts[right_pts.length - 1].y;
                } else {
                    x1 = right_pts[0].x;
                    y1 = right_pts[0].y;
                    x2 = right_pts[1].x;
                    y2 = right_pts[1].y;
                }
                out.line([x1, y1], [x2, y2], [255, 255, 255]);
            }

            out.save(path.join(__dirname, "../../imgout.jpg"));
            out.release();
        }

        return new Promise((resolve, reject) => {
            //let result = []
            cv.readImage(image, function (err, im) {
                if (err) {
                    reject(err)
                    return
                }
                let width = im.width();
                let height = im.height();
                if (width < 1 || height < 1) throw new Error('图片大小不正确！');
                //hue色度，saturation饱和度，value纯度
                //如果需要使用HSV的格式需要添加下面这一句
                im.cvtColor('CV_BGR2HSV')
                //边缘检测
                im.canny(option.lowThresh, option.highThresh);
                //im.erode(2);
                //输入图像用特定结构元素进行膨胀操作.
                im.dilate(2);

                im.save(path.join(__dirname, "../../1.jpg"));
                let out_image = cv.Matrix.Zeros(height, width);
                //计算图片的轮廓
                let contours = im.findContours()
                for (let i = 0; i < contours.size(); i++) {
                    if (!filter(contours, i, height)) continue;
                    //画出轮廓：contours是轮廓,i是序号如果是-1表示全画，然后是颜色，厚度,线的类型
                    out_image.drawContour(contours, i, [255, 255, 255], 2);
                    out_image.save(path.join(__dirname, "../../img" + i + ".jpg"));
                    //把最大的颜色范围显示出来
                    //im.rectangle([rect.x, rect.y], [rect.width, rect.height], [0, 255, 0], 3);
                }
                fitLines(out_image);
                im.release();
                out_image.release();
                //im.save(path.join(__dirname, "../../out.jpg"))
                resolve()
            })
        })
    }
};
