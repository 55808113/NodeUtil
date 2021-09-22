/**
* 生成easyuitree控件函数
* */
const _ = require('lodash')
module.exports = {
    /**
     * 查找节点
     * @param {string} parentdm dm属性类型
     * @param {object[]} nodes 节点对象
     * @returns {null|*}
     */
    findNode: function(parentdm, nodes) {
        if (_.isNull(parentdm)) return null;
        for (let i=0;i<nodes.length;i++)
        {
            let node = nodes[i];
            //console.log(JSON.stringify(node));
            if (parentdm == node.attributes.dm || parentdm == node.id) {
                return node;
            }
            let temp = this.findNode(parentdm, node.children);

            if (temp != null) {
                return temp;
            }
        }
        return null;
    },
    /**
     * 创建comboTree对象
     * @param data row数据集合
     * @param fieldOpt 对象数据集的字段名称
     * {
     *     id:"pkid", //主键
            text:"text", //显示的文字
            title:"title", //提示
            parentid:"parentid", //父节点id
            attributes:{url:"url",dm:"dm"}, //附加的属性字段名称
            parentIconCls:null, //父节点图标
            childIconCls:null, //子节点图标

     * }
     * @param treeobjList tree数组对象,当需要自己添加一些节点时使用
     */
    createTree:function(data,fieldOpt,treeobjList=[]) {
        let tnode = null;
        let tnodeP = null;
        let field = _.assign({},
            {
                id:"pkid",
                text:"text",
                title:"title",
                parentid:"parentid",
                attributes: {}
            }, fieldOpt);

        if (treeobjList.length!=0){
            tnode = treeobjList[0]
        }

        for (let i=0;i<data.length;i++)
        {
            let item = data[i];
            if (tnode != null) {
                tnodeP = this.findNode(item[field.parentid], treeobjList);
            }
            if (tnodeP == null) {
                tnode = {
                    id : item[field.id],
                    text : item[field.text],
                    title : item[field.title],
                    attributes : {},
                    children : []
                };
                //赋值attributes值
                for (let key in field.attributes) {
                    tnode.attributes[key] = item[field.attributes[key]]
                }
                if (field.parentIconCls){
                    tnode.iconCls = field.parentIconCls
                }
                treeobjList.push(tnode);
            }else {
                let treeobj = {
                    id : item[field.id],
                    text : item[field.text],
                    title : item[field.title],
                    attributes : {},
                    children : []
                };
                for (let key in field.attributes) {
                    treeobj.attributes[key] = item[field.attributes[key]]
                }
                if (item[field.isshow]==1){
                    treeobj.bChecked = true;
                }
                if (field.childIconCls){
                    treeobj.iconCls = field.childIconCls
                }
                tnodeP.children.push(treeobj);
                tnodeP.state = "closed";
                tnodeP.bChecked = false;
            }
        };
        return treeobjList;
    }
};
