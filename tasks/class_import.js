/*
 * grunt-class-import
 *
 *
 * Copyright (c) 2013 Franck TANKOUA & Jalal CHAABANE
 * Licensed under the MIT license.
 */'use strict';

module.exports = function(grunt) {

	var orderedClasses = [];
	var baseUrlPath = '';

	/**
	 * 1. If file not already added to the orderedClasses, add it  <-------------
	 * looking the dependencies specified in the file with @classImport:[...]		-
	 * move (if exists) or insert the dependencies upfront.											-
	 * recurssive call with the dependency file for inspection-------------------
	 * @param {File} file
	 */
	var classImport = function(file) {
		var regexp = /@classImport\s*:\s*\[(.+)]/g;
		var dependencyFiles = [];
		var src = grunt.file.read(file);
		var match;

		if (src.length !== 0) {
			while ( match = regexp.exec(src)) {
				var dependencies = match[1].split(',');
				for (var depId in dependencies) {
					dependencyFiles.push(baseUrlPath+"/"+dependencies[depId].trim() + ".js");
				}
			}
			if (orderedClasses.indexOf(file) < 0) {
				orderedClasses.unshift(file);
			}
			for (var i = 0; i < dependencyFiles.length; ++i) {
				if (orderedClasses.indexOf(dependencyFiles[i]) < 0) {
					if (grunt.file.exists(dependencyFiles[i]) === false) {
						grunt.log.error("In " + file + " : " + dependencyFiles[i] + " not such file or directory");
					}
				} else {
					orderedClasses.splice(orderedClasses.indexOf(dependencyFiles[i]), 1);
				}
				orderedClasses.unshift(dependencyFiles[i]);
				classImport(dependencyFiles[i]);
			}
		}
	};

	grunt.registerMultiTask('class_import', 'Prodives an easy way to build a project using OOP with one Class per file.', function() {

		var options = this.options();
		baseUrlPath = options.baseUrlPath;

		if (!this.files) {
			grunt.log.warn('No files found.');
			return;
		}

		this.files.forEach(function(f) {
			var paths = f.src.filter(function(filepath) {
				if (!grunt.file.exists(filepath)) {
					grunt.log.warn('Source file "' + filepath + '" not found.');
					return false;
				} else {
					return true;
				}
			}).map(function(filepath) {
				return filepath;
			});

			for (var p in paths) {
				classImport(paths[p]);
			}
		});

		var dest = this.files[0].dest;
		var finalFileSrc = '';
		orderedClasses.forEach(function(file) {
			// Write the destination file.
			grunt.log.debug('Merging "' + file + '".');
			finalFileSrc += grunt.file.read(file) + "\n";
		});
		grunt.file.write(dest, finalFileSrc);
		grunt.log.writeln('File "' + dest + '" created.');
	});

};
