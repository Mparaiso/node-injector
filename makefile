commit:
	@git add .
	@git commit -am"`date`" | :
push: commit
	@git push origin

