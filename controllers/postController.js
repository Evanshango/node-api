const PostModel = require('../models/postModel');
const formidable = require('formidable');
const fs = require('fs');
const _ = require('lodash');

exports.getPosts = (req, res) => {
    const posts = PostModel.find()
        .populate('postedBy', '_id name')
        .select('_id title body')
        .then(posts => {
            res.json({posts})
        })
        .catch(err => console.log(err));
};

exports.createPost = (req, res, next) => {
    let form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.parse(req, (err, fields, files) => {
        if (err) {
            return res.status(400).json({
                error: 'Image could not be uploaded'
            })
        }
        let post = new PostModel(fields);

        req.profile.hashed_password = undefined;
        req.profile.salt = undefined;
        req.profile.created = undefined;
        req.profile.updated = undefined;

        post.postedBy = req.profile;
        if (files.photo) {
            post.photo.data = fs.readFileSync(files.photo.password);
            post.photo.contentType = files.photo.type
        }
        post.save((err, result) => {
            if (err) {
                return res.status(400).json({
                    error: err
                })
            }
            res.json(result);
        })
    });
};

exports.postsByUser = (req, res) => {
    PostModel.find({postedBy: req.profile._id})
        .populate('postedBy', '_id name')
        .sort('_created')
        .exec((err, posts) => {
            if (err) {
                return res.status(400).json({error: err})
            }
            res.json(posts);
        })
};

exports.postsById = (req, res, next, id) => {
    PostModel.findById(id)
        .populate('postedBy', '_id name')
        .exec((err, post) => {
            if (err || !post) {
                return res.status(400).json({
                    error: err
                });
            }
            req.post = post;
            next();
        })
};

exports.isAuthor = (req, res, next) => {
    let isAuthor = req.post && req.auth && req.post.postedBy._id == req.auth._id;
    if (!isAuthor) {
        return res.status(403).json({
            error: 'User is not authorized'
        })
    }
    next();
};

exports.updatePost = (req, res, next) => {
    let post = req.post;
    post = _.extend(post, req.body);
    post.updated = Date.now();
    post.save(err => {
        if (err) {
            return res.status(400).json({
                error: err
            })
        }
        res.json(post);
    })
};

exports.deletePost = (req, res) => {
    let post = req.post;
    post.remove((err, post) => {
        if (err) {
            return res.status(400).json({
                error: err
            })
        }
        res.json({
            message: 'Post deleted successfully'
        })
    });
};


